/*
 * Copyright 2022 Korandoru Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core'
import zigDistros from './zigDistros.json'

async function main(): Promise<void> {
  const ms: string = core.getInput('milliseconds')
  core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

  core.debug(new Date().toTimeString())
  core.debug(new Date().toTimeString())

  core.info("zigDistros:")
  core.info(JSON.stringify(zigDistros))
}

try {
  await main()
} catch (error) {
  if (error instanceof Error) core.setFailed(error.message)
}
