# Manifest.toml Configuration Documentation

## Overview

The `manifest.toml` file is used to configure metadata information for website icons. Each website directory contains a `manifest.toml` file that defines the icon configuration for that specific website.

## File Format

Manifest files use the TOML format and support defining one or more icon configuration entries.

## Basic Structure

```toml
[[icons]]
domain = "example.com"
site_name = "Example Website"
icon = "icon.png"
aliases = ["alias1.com", "alias2.com"]  # Optional field
```

## Field Descriptions

### Required Fields

- **`domain`** (string): The primary domain name of the website
  - Example: `"google.com"`, `"youtube.com"`
  - Used to identify the website that the icon corresponds to

- **`site_name`** (string): The display name of the website
  - Example: `"Google"`, `"YouTube"`
  - Used for the friendly name displayed in the interface

- **`icon`** (string): The relative path to the icon file
  - Example: `"icon.png"`, `"google.png"`
  - Path to the icon file relative to the current directory

### Optional Fields

- **`aliases`** (string array): Alternative domain names for the website
  - Example: `["gmail.com"]` (corresponding to mail.google.com)
  - Used to configure multiple domain mappings for the same icon

## Multiple Icon Configuration

A manifest.toml file can contain multiple `[[icons]]` blocks to configure different subdomains or services for the same website. Generally, icons should only contain domains that correspond to the directory name and its subdomains. However, in special cases where a website has multiple domains or historical domain names (such as rebranding), they can be placed in the current primary domain directory.

```toml
[[icons]]
domain = "google.com"
site_name = "Google"
icon = "google.png"

[[icons]]
domain = "mail.google.com"
site_name = "Gmail"
icon = "gmail.png"
aliases = ["gmail.com"]
```

## Practical Examples

### Single Icon Configuration

```toml
[[icons]]
domain = "youtube.com"
site_name = "YouTube"
icon = "icon.png"
```

### Multiple Icon Configuration (Google Example)

```toml
[[icons]]
domain = "google.com"
site_name = "Google"
icon = "google.png"

[[icons]]
domain = "mail.google.com"
site_name = "Gmail"
icon = "gmail.png"
aliases = ["gmail.com"]
```

### Configuration with Historical Domains (X/Twitter Example)

This example shows how to handle rebranding scenarios where both the new and old domain names are configured in the same manifest file:

```toml
[[icons]]
domain = "x.com"
site_name = "X"
icon = "icon.png"

[[icons]]
domain = "twitter.com"
site_name = "Twitter"
icon = "icon.png"
```

In this case, both `x.com` (current domain) and `twitter.com` (historical domain) are configured in the `x.com/` directory since they represent the same service after rebranding.

## File Naming Conventions

- Manifest files must be named `manifest.toml`
- Each website directory contains one manifest.toml file
- Icon files are typically named `icon.png`, though special cases may use other names (e.g., Google's `google.png` and `gmail.png`)

## Adding New Configurations

To add a new website icon:

1. Create a directory named after the domain
2. Place the icon file in the directory
3. Create a `manifest.toml` file and configure the appropriate fields
4. Add alias configurations as needed
