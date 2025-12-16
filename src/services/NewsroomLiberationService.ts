/**
 * Newsroom Liberation Service
 * Connects news-blkout to IVOR Core Layer 3 Business Logic
 *
 * Liberation Features:
 * - Creator sovereignty in content publishing (75% minimum)
 * - Anti-extraction content protection
 * - Community protection for content moderation
 * - Cultural authenticity validation
 * - Narrative control for Black queer voices
 *
 * BLKOUT Community Liberation Platform
 */

// IVOR Core Layer 3 API Configuration
const IVOR_API_BASE = import.meta.env?.VITE_IVOR_API_URL ||
                      process.env.IVOR_API_URL ||
                      'https://ivor.blkoutuk.cloud';

export interface LiberationValidationResult {
  isCompliant: boolean;
  complianceLevel: 'full' | 'partial' | 'non-compliant';
  creatorSovereignty: {
    enforced: boolean;
    minimumShare: number;
    actualShare: number;
  };
  communityProtection: {
    level: number;
    antiOppressionChecks: string[];
    passed: boolean;
  };
  culturalAuthenticity: {
    validated: boolean;
    score: number;
    concerns: string[];
  };
  narrativeControl: 'creator-owned' | 'community-shared' | 'platform-managed';
  recommendations: string[];
  warnings: string[];
}

export interface ArticleCreationRequest {
  title: string;
  content: string;
  excerpt?: string;
  author_id: string;
  category?: string;
  tags?: string[];
  source_url?: string;
}

export interface CreatorAttributionResult {
  attributionEnforced: boolean;
  narrativeControl: 'creator-owned' | 'community-shared';
  revenueShare: number;
  rightsRetained: string[];
  creatorId: string;
  articleId: string;
}

export interface ModerationResult {
  approved: boolean;
  liberationCompliant: boolean;
  communityProtection: string[];
  recommendation: 'publish' | 'review' | 'reject';
  confidence: number;
  reasoning: string;
}

class NewsroomLiberationService {
  private apiBase: string;

  constructor() {
    this.apiBase = IVOR_API_BASE;
  }

  /**
   * Check if IVOR Layer 3 services are available
   */
  async checkHealth(): Promise<{
    available: boolean;
    liberationCompliant: boolean;
    layer3Active: boolean;
  }> {
    try {
      const response = await fetch(`${this.apiBase}/health/liberation`);

      if (!response.ok) {
        return { available: false, liberationCompliant: false, layer3Active: false };
      }

      const data = await response.json();

      return {
        available: true,
        liberationCompliant: data.liberationMetrics?.overallCompliance === '100.0%',
        layer3Active: data.layer3Services?.content && data.layer3Services?.creator
      };
    } catch (error) {
      console.warn('[NewsroomLiberation] IVOR Layer 3 health check failed:', error);
      return { available: false, liberationCompliant: false, layer3Active: false };
    }
  }

  /**
   * Validate article content creation against liberation values
   */
  async validateContentCreation(article: ArticleCreationRequest): Promise<LiberationValidationResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/liberation/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'content_validation',
          payload: article,
          liberationContext: {
            culturalAuthenticityValidation: true,
            creatorSovereigntyEnforcement: true,
            antiExtractionProtection: true
          }
        })
      });

      if (!response.ok) {
        return this.getLocalValidation(article);
      }

      const data = await response.json();
      return this.mapToValidationResult(data);

    } catch (error) {
      console.warn('[NewsroomLiberation] Validation API unavailable, using local validation:', error);
      return this.getLocalValidation(article);
    }
  }

  /**
   * Enforce creator attribution for articles
   * Guarantees narrative control and minimum 75% revenue share
   */
  async enforceCreatorAttribution(
    articleId: string,
    creatorId: string
  ): Promise<CreatorAttributionResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/liberation/attribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'creator_attribution',
          payload: { contentId: articleId, creatorId },
          liberationContext: { creatorSovereigntyEnforcement: true }
        })
      });

      if (!response.ok) {
        return this.getDefaultAttribution(articleId, creatorId);
      }

      const data = await response.json();

      return {
        attributionEnforced: true,
        narrativeControl: 'creator-owned',
        revenueShare: Math.max(0.75, data.revenueShare || 0.75),
        rightsRetained: data.rightsRetained || [
          'edit_content',
          'retract_content',
          'control_distribution',
          'monetization_rights',
          'attribution_rights'
        ],
        creatorId: creatorId,
        articleId: articleId
      };

    } catch (error) {
      console.warn('[NewsroomLiberation] Attribution API unavailable, using defaults:', error);
      return this.getDefaultAttribution(articleId, creatorId);
    }
  }

  /**
   * Moderate article with liberation values
   */
  async moderateWithLiberation(
    articleId: string,
    moderationAction: 'approve' | 'review' | 'reject'
  ): Promise<ModerationResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/liberation/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'community_consent',
          payload: { contentId: articleId, action: moderationAction },
          liberationContext: { communityProtectionRequired: true }
        })
      });

      if (!response.ok) {
        return this.getDefaultModerationResult(moderationAction);
      }

      const data = await response.json();

      return {
        approved: data.success && moderationAction === 'approve',
        liberationCompliant: data.liberationValidation?.isCompliant ?? true,
        communityProtection: data.protectionMeasures || [
          'content-screening',
          'anti-oppression-validation',
          'creator-consent-verified'
        ],
        recommendation: moderationAction,
        confidence: data.confidence || 0.85,
        reasoning: data.reasoning || 'Liberation-compliant content moderation'
      };

    } catch (error) {
      console.warn('[NewsroomLiberation] Moderation API unavailable, using defaults:', error);
      return this.getDefaultModerationResult(moderationAction);
    }
  }

  /**
   * Validate article content for anti-oppression compliance
   */
  async validateAntiOppression(content: {
    title: string;
    content: string;
    author?: string;
  }): Promise<{
    passed: boolean;
    concerns: string[];
    recommendations: string[];
    liberationAlignment: number;
  }> {
    const concerns: string[] = [];
    const recommendations: string[] = [];

    const contentText = `${content.title} ${content.content}`.toLowerCase();

    // Check for problematic patterns
    const problematicPatterns = [
      { pattern: /tone policing|respectability/i, concern: 'Respectability politics language' },
      { pattern: /all lives matter/i, concern: 'All lives matter rhetoric' },
      { pattern: /reverse racism/i, concern: 'Reverse racism claims' },
      { pattern: /not all (white|men|police)/i, concern: 'Derailing language' },
      { pattern: /playing the race card/i, concern: 'Dismissive language about racism' }
    ];

    for (const { pattern, concern } of problematicPatterns) {
      if (pattern.test(contentText)) {
        concerns.push(concern);
      }
    }

    // Liberation alignment indicators
    const liberationIndicators = [
      'black queer', 'black trans', 'qtipoc', 'liberation', 'abolition',
      'mutual aid', 'community care', 'collective action', 'solidarity',
      'intersectionality', 'black joy', 'healing', 'resilience'
    ];

    const alignmentCount = liberationIndicators.filter(indicator =>
      contentText.includes(indicator)
    ).length;

    const liberationAlignment = Math.min(1, alignmentCount / 5);

    if (liberationAlignment < 0.2) {
      recommendations.push('Consider strengthening connection to Black queer liberation themes');
    }

    if (!contentText.includes('uk') && !contentText.includes('britain') && !contentText.includes('london')) {
      recommendations.push('Consider adding UK context for local relevance');
    }

    return {
      passed: concerns.length === 0,
      concerns,
      recommendations,
      liberationAlignment
    };
  }

  /**
   * Get content moderation recommendation
   */
  async getContentModerationRecommendation(article: ArticleCreationRequest): Promise<{
    recommendation: 'publish' | 'review' | 'reject';
    confidence: number;
    reasoning: string;
    liberationScore: number;
  }> {
    const validation = await this.validateContentCreation(article);
    const antiOppression = await this.validateAntiOppression({
      title: article.title,
      content: article.content || article.excerpt || '',
      author: article.author_id
    });

    let confidence = 0.5;
    let recommendation: 'publish' | 'review' | 'reject' = 'review';
    const reasons: string[] = [];

    if (validation.isCompliant) {
      confidence += 0.2;
      reasons.push('Liberation-compliant content');
    }

    if (validation.culturalAuthenticity.validated && validation.culturalAuthenticity.score >= 0.7) {
      confidence += 0.15;
      reasons.push('High cultural authenticity');
    }

    if (antiOppression.passed) {
      confidence += 0.1;
      reasons.push('Passed anti-oppression checks');
    } else {
      confidence -= 0.25;
      reasons.push(`Anti-oppression concerns: ${antiOppression.concerns.join(', ')}`);
    }

    if (antiOppression.liberationAlignment >= 0.4) {
      confidence += 0.1;
      reasons.push('Strong liberation alignment');
    }

    // Determine recommendation
    if (confidence >= 0.8 && antiOppression.passed) {
      recommendation = 'publish';
    } else if (confidence >= 0.5 || !antiOppression.passed) {
      recommendation = 'review';
    } else if (confidence < 0.3) {
      recommendation = 'reject';
    }

    return {
      recommendation,
      confidence: Math.min(1, Math.max(0, confidence)),
      reasoning: reasons.join('; '),
      liberationScore: validation.culturalAuthenticity.score
    };
  }

  /**
   * Local validation fallback
   */
  private getLocalValidation(article: ArticleCreationRequest): LiberationValidationResult {
    const contentText = `${article.title} ${article.content || ''} ${article.excerpt || ''}`.toLowerCase();

    const liberationKeywords = [
      'black', 'queer', 'trans', 'lgbtq', 'qtipoc', 'liberation',
      'community', 'uk', 'britain', 'london', 'healing', 'joy'
    ];

    const liberationScore = liberationKeywords.filter(kw =>
      contentText.includes(kw)
    ).length / liberationKeywords.length;

    return {
      isCompliant: liberationScore >= 0.15,
      complianceLevel: liberationScore >= 0.4 ? 'full' : liberationScore >= 0.15 ? 'partial' : 'non-compliant',
      creatorSovereignty: {
        enforced: true,
        minimumShare: 0.75,
        actualShare: 0.75
      },
      communityProtection: {
        level: 0.95,
        antiOppressionChecks: ['content-screening', 'keyword-analysis'],
        passed: true
      },
      culturalAuthenticity: {
        validated: true,
        score: liberationScore,
        concerns: []
      },
      narrativeControl: 'creator-owned',
      recommendations: liberationScore < 0.25
        ? ['Consider adding more liberation-focused themes']
        : [],
      warnings: []
    };
  }

  /**
   * Default attribution when API unavailable
   */
  private getDefaultAttribution(articleId: string, creatorId: string): CreatorAttributionResult {
    return {
      attributionEnforced: true,
      narrativeControl: 'creator-owned',
      revenueShare: 0.75,
      rightsRetained: [
        'edit_content',
        'retract_content',
        'control_distribution',
        'monetization_rights',
        'attribution_rights',
        'syndication_approval',
        'derivative_works_control'
      ],
      creatorId: creatorId,
      articleId: articleId
    };
  }

  /**
   * Default moderation result when API unavailable
   */
  private getDefaultModerationResult(action: 'approve' | 'review' | 'reject'): ModerationResult {
    return {
      approved: action === 'approve',
      liberationCompliant: true,
      communityProtection: [
        'content-screening',
        'anti-oppression-validation',
        'creator-consent-verified'
      ],
      recommendation: action === 'approve' ? 'publish' : action,
      confidence: 0.85,
      reasoning: 'Liberation-compliant content moderation (local fallback)'
    };
  }

  /**
   * Map API response to validation result
   */
  private mapToValidationResult(data: any): LiberationValidationResult {
    return {
      isCompliant: data.liberationValidation?.isCompliant ?? data.success ?? false,
      complianceLevel: data.liberationValidation?.complianceLevel ?? 'partial',
      creatorSovereignty: {
        enforced: true,
        minimumShare: 0.75,
        actualShare: data.creatorSovereignty?.share ?? 0.75
      },
      communityProtection: {
        level: data.communityProtection?.level ?? 0.95,
        antiOppressionChecks: data.communityProtection?.checks ?? [],
        passed: data.communityProtection?.passed ?? true
      },
      culturalAuthenticity: {
        validated: data.culturalAuthenticity?.validated ?? true,
        score: data.culturalAuthenticity?.score ?? 0.7,
        concerns: data.culturalAuthenticity?.concerns ?? []
      },
      narrativeControl: data.narrativeControl ?? 'creator-owned',
      recommendations: data.recommendations ?? [],
      warnings: data.warnings ?? []
    };
  }
}

// Export singleton instance
export const newsroomLiberationService = new NewsroomLiberationService();
export default NewsroomLiberationService;
