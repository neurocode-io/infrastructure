import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

type NginxOpts = {
  version: string
  provider: k8s.Provider
  loadBalancerIP?: pulumi.Output<string>
}
const namespace = new k8s.core.v1.Namespace('ingress', {
  metadata: {
    name: 'ingress',
  },
})

export const createNginx = (opts: NginxOpts) => {
  new k8s.helm.v3.Chart(
    'nginx',
    {
      namespace: namespace.metadata.name,
      chart: 'ingress-nginx',
      version: opts.version,
      fetchOpts: { repo: 'https://kubernetes.github.io/ingress-nginx' },
      values: {
        controller: {
          metrics: {
            enabled: false,
          },
          service: {
            loadBalancerIP: opts.loadBalancerIP,
            externalTrafficPolicy: 'Local',
            annotations: {
              'service.beta.kubernetes.io/azure-load-balancer-mixed-protocols': true,
              'service.beta.kubernetes.io/azure-load-balancer-resource-group':
                'ne-live-aks-nodes',
              'service.beta.kubernetes.io/azure-dns-label-name': 'neurocode',
            },
          },
        },
        autoscaling: {
          enabled: true,
          minReplicas: 1,
          maxReplicas: 3,
        },
      },
    },
    { providers: { kubernetes: opts.provider } },
  )
}
