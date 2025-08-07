import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { load } from "js-toml";
import { z } from "zod";

// Zod schema for icon configuration
const IconConfigSchema = z.object({
    domain: z.string().min(1, "Domain is required"),
    site_name: z.string().min(1, "Site name is required"),
    icon: z.string().min(1, "Icon path is required"),
    aliases: z.array(z.string()).optional()
});

const ManifestSchema = z.object({
    icons: z.array(IconConfigSchema)
});

// Output icon type (without aliases)
interface OutputIcon {
    domain: string;
    site_name: string;
    icon: string;
}

async function main() {
    const rootDir = join(import.meta.dir, "..");
    const distDir = join(rootDir, "dist");

    // Create dist directory
    if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
    }

    // Collect all manifest.toml files
    const manifestFiles: string[] = [];
    const allIcons: OutputIcon[] = [];
    const iconPaths = new Set<string>();

    // Find all manifest.toml files (non-recursive, only direct subdirectories)
    function findManifests(dir: string) {
        const entries = readdirSync(dir);

        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            // Skip non-directories
            if (!stat.isDirectory()) continue;

            // Skip directories starting with . or _
            if (entry.startsWith(".") || entry.startsWith("_")) continue;

            // Skip directories without a dot in the name (not domain-like)
            if (!entry.includes(".")) continue;

            // Check if manifest.toml exists in this directory
            const manifestPath = join(fullPath, "manifest.toml");
            if (existsSync(manifestPath)) {
                manifestFiles.push(manifestPath);
            }
        }
    }

    findManifests(rootDir);

    console.log(`Found ${manifestFiles.length} manifest files`);

    // Parse all manifest.toml files
    for (const manifestPath of manifestFiles) {
        const manifestDir = dirname(manifestPath);
        const relativePath = relative(rootDir, manifestDir);

        try {
            const content = await Bun.file(manifestPath).text();
            const rawData = load(content);

            // Validate with Zod schema
            const parseResult = ManifestSchema.safeParse(rawData);

            if (!parseResult.success) {
                console.error(`Validation error in ${manifestPath}:`);
                console.error(parseResult.error.issues);
                continue;
            }

            const data = parseResult.data;

            for (const icon of data.icons) {
                // Add main icon configuration
                const iconWithPath = {
                    domain: icon.domain,
                    site_name: icon.site_name,
                    icon: join(relativePath, icon.icon)
                };
                allIcons.push(iconWithPath);

                // aliases
                if (icon.aliases && icon.aliases.length > 0) {
                    for (const alias of icon.aliases) {
                        const aliasIcon = {
                            domain: alias,
                            site_name: icon.site_name,
                            icon: join(relativePath, icon.icon)
                        };
                        allIcons.push(aliasIcon);
                    }
                }

                // Record image files to copy
                const iconSourcePath = join(manifestDir, icon.icon);
                const iconDestPath = join(distDir, relativePath, icon.icon);
                iconPaths.add(JSON.stringify({ src: iconSourcePath, dest: iconDestPath }));
            }
        } catch (error) {
            console.error(`Error parsing ${manifestPath}:`, error);
        }
    }

    console.log(`Collected ${allIcons.length} icon configurations`);

    // Convert flat icon list to nested domain structure
    function buildNestedDomainStructure(icons: OutputIcon[]): any {
        const result: any = {};
        
        for (const icon of icons) {
            // Split domain into parts and reverse (com.google.mail -> ["mail", "google", "com"])
            const parts = icon.domain.split('.').reverse();
            
            // Navigate/create nested structure
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!part) continue; // Skip empty parts
                
                if (i === parts.length - 1) {
                    // Last part - add under "." key
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current[part]['.'] = {
                        domain: icon.domain,
                        site_name: icon.site_name,
                        icon: icon.icon
                    };
                } else {
                    // Intermediate parts - create nested objects
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
            }
        }
        
        return result;
    }

    const nestedIcons = buildNestedDomainStructure(allIcons);

    // Generate aggregated manifest.json
    const manifestJson = {
        icons: nestedIcons,
        totalCount: allIcons.length,
        generatedAt: new Date().toISOString()
    };

    await Bun.write(
        join(distDir, "manifest.json"),
        JSON.stringify(manifestJson, null, 2)
    );

    console.log("Generated manifest.json");

    // Copy all image files
    let copiedCount = 0;
    for (const pathInfo of iconPaths) {
        const { src, dest } = JSON.parse(pathInfo);

        if (existsSync(src)) {
            // Ensure target directory exists
            const destDir = dirname(dest);
            if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
            }

            // Copy file
            copyFileSync(src, dest);
            copiedCount++;
        } else {
            console.warn(`Icon file not found: ${src}`);
        }
    }

    console.log(`Copied ${copiedCount} icon files to dist directory`);
    console.log("Deployment preparation completed!");
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
});