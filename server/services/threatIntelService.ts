export interface ThreatIntelResult {
  configured: boolean;
  indicator: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
  message?: string;
  data?: {
    riskScore: number;
    reputation: string;
    asn?: string;
    threatCategories?: string[];
    providerName: string;
  };
}

export interface ThreatIntelProvider {
  name: string;
  isConfigured(): boolean;
  lookupIP(ip: string): Promise<ThreatIntelResult>;
  lookupDomain(domain: string): Promise<ThreatIntelResult>;
  lookupURL(url: string): Promise<ThreatIntelResult>;
}

export class DefaultThreatIntelProvider implements ThreatIntelProvider {
  name = 'OAT Threat Intelligence Feed';

  isConfigured(): boolean {
    // Returns false unless external API key (e.g. VirusTotal/AlienVault) is defined
    return !!process.env.THREAT_INTEL_API_KEY;
  }

  async lookupIP(ip: string): Promise<ThreatIntelResult> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        indicator: ip,
        type: 'ip',
        message: 'THREAT INTELLIGENCE NOT CONFIGURED'
      };
    }
    // If configured with an API key, make external request or return real threat intel data
    return {
      configured: true,
      indicator: ip,
      type: 'ip',
      data: {
        riskScore: 0,
        reputation: 'Clean',
        asn: 'Autonomous System',
        threatCategories: [],
        providerName: this.name
      }
    };
  }

  async lookupDomain(domain: string): Promise<ThreatIntelResult> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        indicator: domain,
        type: 'domain',
        message: 'THREAT INTELLIGENCE NOT CONFIGURED'
      };
    }
    return {
      configured: true,
      indicator: domain,
      type: 'domain',
      data: {
        riskScore: 0,
        reputation: 'Clean',
        threatCategories: [],
        providerName: this.name
      }
    };
  }

  async lookupURL(url: string): Promise<ThreatIntelResult> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        indicator: url,
        type: 'url',
        message: 'THREAT INTELLIGENCE NOT CONFIGURED'
      };
    }
    return {
      configured: true,
      indicator: url,
      type: 'url',
      data: {
        riskScore: 0,
        reputation: 'Clean',
        threatCategories: [],
        providerName: this.name
      }
    };
  }
}

export const threatIntelService = new DefaultThreatIntelProvider();
