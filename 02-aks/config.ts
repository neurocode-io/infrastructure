import * as pulumui from '@pulumi/pulumi'
import { z } from 'zod'

const AksConfigSchema = z.object({
  version: z.string(),
  adminGroupIds: z.string().uuid().array(),
  controlPlane: z.object({
    vmSize: z.string(),
    zones: z.string().array().max(3).min(1),
  }),
  dataPlane: z.record(
    z.object({
      vmSize: z.string(),
      minCount: z.number().positive(),
      maxCount: z.number().positive(),
      zones: z.string().array().max(3).min(1),
    }),
  ),
})

const config = new pulumui.Config()

const lo = {
  northeurope: 'ne',
  westeurope: 'we',
  francecentral: 'fc',
}

const env = pulumui.getStack()

//@ts-ignore
const shortLocation = lo[config.require('deployLocation')]
if (!shortLocation) throw new Error('ConfigError: Unknown location provided')

export const location = config.require('deployLocation')
export const prefix = `${shortLocation}-${env}`

export const AKS = AksConfigSchema.parse(config.requireObject('config'))

export const tags = {
  managedBy: 'pulumi',
}
