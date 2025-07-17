export interface SubmissionResult {
  success: boolean;
  response?: any;
  error?: string;
}

export class GovernmentApiService {
  private readonly apiUrl = "https://hospedajes.ses.mir.es/hospedajes-sede/api/comunicaciones";
  private readonly maxRetries = 3;

  async submitParteViajeros(xmlContent: string): Promise<SubmissionResult> {
    let lastError: string = "";
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            'User-Agent': 'Albergue-Del-Carrascalejo/1.0',
          },
          body: xmlContent,
        });

        if (response.ok) {
          const responseData = await response.text();
          return {
            success: true,
            response: responseData
          };
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          
          // If it's a client error (4xx), don't retry
          if (response.status >= 400 && response.status < 500) {
            break;
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown network error";
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.delay(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    return {
      success: false,
      error: lastError
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const governmentApiService = new GovernmentApiService();
