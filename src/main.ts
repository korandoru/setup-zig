/*
 * Copyright 2023 Korandoru Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core'
import * as cache from '@actions/tool-cache'
import * as path from 'path'
import * as fs from 'fs'
import {readFile} from 'fs/promises'

interface DistroData {
  tarball: string
  shasum: string
  size: string
}

const platformPattern = /(?<arch>\w+)-(?<os>\w+)/

async function resolveArchPlatform(): Promise<{
  arch: string
  platform: string
}> {
  const targetPlatform: string = core.getInput('target-platform')
  if (targetPlatform && targetPlatform.length > 0) {
    const matches = platformPattern.exec(targetPlatform)
    if (matches && matches.groups) {
      return {
        arch: matches.groups.arch,
        platform: matches.groups.os
      }
    } else {
      throw new Error(`Unparsed target-platform: ${targetPlatform}`)
    }
  }

  const platform = process.platform
  let resolvedPlatform: string
  switch (platform) {
    case 'darwin':
      resolvedPlatform = 'macos'
      break
    case 'win32':
      resolvedPlatform = 'windows'
      break
    case 'freebsd':
    case 'netbsd':
    case 'openbsd':
      resolvedPlatform = 'freebsd'
      break
    case 'linux':
    case 'cygwin':
    case 'android':
      resolvedPlatform = 'linux'
      break
    default:
      core.warning(`Unknown platform: ${platform}; resolved as "linux"`)
      resolvedPlatform = 'linux'
      break
  }

  const arch = process.arch
  let resolvedArch: string
  switch (arch) {
    case 'arm64':
      resolvedArch = 'aarch64'
      break
    case 'x64':
      resolvedArch = 'x86_64'
      break
    case 'ia32':
      resolvedArch = 'i386'
      break
    case 'mips':
      resolvedArch = 'riscv64'
      break
    default:
      throw new Error(`Unsupported arch: ${arch}`)
  }

  return {
    arch: resolvedArch,
    platform: resolvedPlatform
  }
}

async function downloadZigDistrosMetadata(): Promise<any> {
  const metadataPath = await cache.downloadTool('https://ziglang.org/download/index.json')
  const metadata = await readFile(metadataPath, 'utf-8')
  return JSON.parse(metadata)
}

async function main(): Promise<void> {
  const zigVersion: string = core.getInput('zig-version')
  const zigDistros = await downloadZigDistrosMetadata()
  const availableVersions = Object.keys(zigDistros)

  const {arch, platform} = await resolveArchPlatform()
  const targetPlatform = `${arch}-${platform}`
  core.info(`Targeting to platform ${targetPlatform}...`)

  let versionSpec: string
  let tarballLink: string

  if (!availableVersions.includes(zigVersion)) {
    versionSpec = zigVersion
    tarballLink = `https://ziglang.org/builds/zig-${platform}-${arch}-${versionSpec}.tar.xz`
    core.info(`Using version ${versionSpec} with link ${tarballLink}`)
  } else {
    const zigVersionedDistro = (zigDistros as Record<string, any>)[zigVersion]
    versionSpec = zigVersion !== 'master' ? zigVersion : zigVersionedDistro['version']
    core.info(`Using version ${versionSpec}...`)
    const availablePlatform = Object.keys(zigVersionedDistro)
    if (!availablePlatform.includes(targetPlatform)) {
      throw new Error(`Unsupported platform: ${targetPlatform}`)
    }
    const zigDistro = (zigVersionedDistro as Record<string, DistroData>)[targetPlatform]
    tarballLink = zigDistro.tarball
    core.info(`Using link ${tarballLink}`)
  }

  const toolPath = cache.find('zig', versionSpec, targetPlatform)
  if (toolPath) {
    core.info(`Cache hit ${toolPath}`)
    core.addPath(toolPath)
    return
  }
  core.info(`Cache miss. Downloading...`)

  const tarballPath = await cache.downloadTool(tarballLink)
  let extractedPath: string
  if (tarballLink.endsWith('tar.xz')) {
    extractedPath = await cache.extractTar(tarballPath, undefined, ['x', '--strip', '1'])
  } else if (tarballLink.endsWith('zip')) {
    extractedPath = await cache.extractZip(tarballPath)
    const nestedPath = path.join(extractedPath, path.basename(tarballLink, '.zip'))
    if (fs.existsSync(nestedPath)) {
      extractedPath = nestedPath
    }
  } else {
    throw new Error(`Unsupported compression: ${tarballLink}`)
  }
  const cachedToolPath = await cache.cacheDir(extractedPath, 'zig', versionSpec, targetPlatform)
  core.info(`Cache new ${cachedToolPath}`)
  core.addPath(cachedToolPath)
}

try {
  await main()
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message)
}
