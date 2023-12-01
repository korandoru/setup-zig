# Setup Zig

[![CI](https://github.com/korandoru/setup-zig/actions/workflows/ci.yml/badge.svg)](https://github.com/korandoru/setup-zig/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/korandoru/setup-zig)](https://github.com/korandoru/setup-zig/releases)
[![release date](https://img.shields.io/github/release-date/korandoru/setup-zig)](https://github.com/korandoru/setup-zig/releases)

This action provides the following functionality for GitHub Actions users:

* Downloading and caching distribution of the requested Zig version, and adding it to the PATH

## Usage

See [action.yml](action.yml).

**Basic:**

```yml
steps:
  - uses: actions/checkout@v3
  - uses: korandoru/setup-zig@v1
    with:
      zig-version: 0.9.1 # released versions or master
  - run: zig build test
```

The `zig-version` input is required. Options include [all released versions](https://ziglang.org/download/) or "master".

The action will first check the local cache for a semver match. If unable to find a specific version in the cache, the action will attempt to download a version of Zig.

For information regarding locally cached versions of Zig on GitHub-hosted runners, check out [GitHub Actions Runner Images](https://github.com/actions/runner-images).

## Matrix Testing

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        zig: [ 0.12.0-dev.1710+2bffd8101, 0.11.0, 0.10.0, master ]
        os: [ ubuntu-latest, windows-latest, macos-latest ]
    runs-on: ${{ matrix.os }}
    name: Zig ${{ matrix.zig }} on ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - name: Setup Zig
        uses: korandoru/setup-zig@v1
        with:
          zig-version: ${{ matrix.zig }}
      - run: zig build test
```

## License

The scripts and documentation in this project are released under the [Apache License 2.0](LICENSE).
