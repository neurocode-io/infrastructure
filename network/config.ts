import * as pulmui from '@pulumi/pulumi'

const config = new pulmui.Config()

const lo = {
  northeurope: 'ne',
  westeurope: 'we',
  francecentral: 'fc',
}

const env = pulmui.getStack()

//@ts-ignore
const shortLocation = lo[config.require('deployLocation')]
if (!shortLocation) throw new Error('ConfigError: Unknown location provided')

export const location = config.require('deployLocation')
export const prefix = `${shortLocation}-${env}`
export const vnetCidrs = config.requireObject<string[]>('vnetCidrs')
export const subnetCidrs = config.requireObject<{ [k: string]: string }[]>(
  'subnetCidrs',
)

export const tags = {
  managedBy: 'pulumi',
}
