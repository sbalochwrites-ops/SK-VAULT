# SK Vault — Long-Term Cold Storage

SK Vault is an AES-256 encrypted cold-storage repository for photos, videos, and critical documents. Designed for decades of retention, zero-knowledge security, and multi-region backup resilience.

## Features

- **Decentralized Cold-Storage Vault**: Built for decade-scale archival preservation.
- **Zero-Knowledge Encryption**: AES-256-GCM encryption with cryptographic integrity proof hashes (SHA-256).
- **Multi-Region Replication**: Simulated 3-region active persistence across `us-west-1`, `eu-central-1`, and `ap-se-1`.
- **Retention Policies**: WORM (Write Once, Read Many) immutable lock with options for *Kept Forever*, *25 Years*, *10 Years*, and *5 Years*.
- **Asset Categories**: Dedicated browsing for Photos, Videos, and Legal Documents with live storage metrics.
- **Interactive File Management**:
  - Drag-and-drop file uploader with real-time multi-stage encryption progress bar.
  - Interactive File Detail and Preview modal with full cryptographic metadata inspection.
  - Direct file download and SHA-256 checksum copying.
  - Real-time search, sorting (Date, Name, Size), and responsive Grid / List views.
- **Responsive Shell**: Seamless experience across desktop and mobile devices.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React