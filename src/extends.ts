/* global jestPlaywright, browserName, deviceName */
/* eslint-disable @typescript-eslint/no-explicit-any*/
import { getSkipFlag, deepMerge } from './utils'
import { BrowserType, JestPlaywrightConfig, SkipOption } from '../types/global'

type TestType = 'it' | 'describe'

interface PlaywrightOptions extends JestPlaywrightConfig {
  browser?: BrowserType
}

const DEBUG_OPTIONS = {
  launchOptions: {
    headless: false,
    devtools: true,
  },
}

const runDebugTest = (jestTestType: jest.It, ...args: any[]) => {
  const isConfigProvided = typeof args[0] === 'object'
  // TODO Looks weird - need to be rewritten
  let options = DEBUG_OPTIONS as JestPlaywrightConfig
  if (isConfigProvided) {
    options = deepMerge(DEBUG_OPTIONS, args[0])
  }

  jestTestType(args[isConfigProvided ? 1 : 0], async () => {
    const { browser, context, page } = await jestPlaywright.configSeparateEnv(
      options,
      true,
    )
    try {
      await args[isConfigProvided ? 2 : 1]({ browser, context, page })
    } finally {
      await browser!.close()
    }
  })
}

// @ts-ignore
it.jestPlaywrightDebug = (...args) => {
  runDebugTest(it, ...args)
}

it.jestPlaywrightDebug.only = (...args) => {
  runDebugTest(it.only, ...args)
}

it.jestPlaywrightDebug.skip = (...args) => {
  runDebugTest(it.skip, ...args)
}

const runConfigTest = (
  jestTypeTest: jest.It,
  playwrightOptions: PlaywrightOptions,
  ...args: any[]
) => {
  if (playwrightOptions.browser && playwrightOptions.browser !== browserName) {
    // @ts-ignore
    it.skip(...args)
  } else {
    jestTypeTest(args[0], async () => {
      const { browser, context, page } = await jestPlaywright.configSeparateEnv(
        playwrightOptions,
      )
      try {
        await args[1]({ browser, context, page })
      } finally {
        await browser!.close()
      }
    })
  }
}

//@ts-ignore
it.jestPlaywrightConfig = (playwrightOptions, ...args) => {
  runConfigTest(it, playwrightOptions, ...args)
}

it.jestPlaywrightConfig.only = (...args) => {
  runConfigTest(it.only, ...args)
}

it.jestPlaywrightConfig.skip = (...args) => {
  runConfigTest(it.skip, ...args)
}

const customSkip = (skipOption: SkipOption, type: TestType, ...args: any[]) => {
  const skipFlag = getSkipFlag(skipOption, browserName, deviceName)
  if (skipFlag) {
    // @ts-ignore
    global[type].skip(...args)
  } else {
    // @ts-ignore
    global[type](...args)
  }
}

it.jestPlaywrightSkip = (skipOption, ...args) => {
  customSkip(skipOption, 'it', ...args)
}

//@ts-ignore
describe.jestPlaywrightSkip = (skipOption: SkipOption, ...args) => {
  customSkip(skipOption, 'describe', ...args)
}
