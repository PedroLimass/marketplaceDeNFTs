import { delay, http, HttpResponse } from 'msw'

import { apiPath, relativePath } from '../lib/apiPath'
import { getScenario, nextRequestCount } from '../scenarios/current'

export const scenarioHandler = http.all(apiPath('/*'), async ({ request }) => {
  const method = request.method.toUpperCase()
  const pathname = relativePath(request.url)
  const plan = getScenario().plan({
    method,
    pathname,
    count: nextRequestCount(method, pathname),
  })

  if (plan.delayMs > 0) await delay(plan.delayMs)

  switch (plan.outcome?.type) {
    case 'network-error':
      return HttpResponse.error()
    case 'hang':
      await delay('infinite')
      return undefined
    case 'error':
      return HttpResponse.json(
        { error: { code: plan.outcome.code, message: plan.outcome.message } },
        { status: plan.outcome.status },
      )
    case undefined:
      return undefined
  }
})
