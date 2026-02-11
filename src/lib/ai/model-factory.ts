import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export type AIProvider = 'openai' | 'anthropic' | 'google';

type ModelSelection = {
    provider: AIProvider;
    modelName: string;
    model: ReturnType<typeof openai> | ReturnType<typeof anthropic> | ReturnType<typeof google>;
};

const PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'google'];

const DEFAULT_MODELS: Record<AIProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    google: 'gemini-1.5-flash',
};

const quotaBlockedProviders = new Set<AIProvider>();

function normalizeProvider(provider: string | undefined): AIProvider {
    if (provider === 'anthropic' || provider === 'google' || provider === 'openai') {
        return provider;
    }

    return 'openai';
}

function hasProviderKey(provider: AIProvider): boolean {
    switch (provider) {
        case 'openai':
            return Boolean(process.env.OPENAI_API_KEY);
        case 'anthropic':
            return Boolean(process.env.ANTHROPIC_API_KEY);
        case 'google':
            return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        default:
            return false;
    }
}

function createProviderModel(provider: AIProvider, modelName: string): ModelSelection['model'] {
    switch (provider) {
        case 'openai':
            return openai(modelName);
        case 'anthropic':
            return anthropic(modelName);
        case 'google':
            return google(modelName);
        default:
            return openai(DEFAULT_MODELS.openai);
    }
}

function getPreferredModelName(provider: AIProvider): string {
    const configuredProvider = normalizeProvider(process.env.AI_PROVIDER);

    if (provider === configuredProvider && process.env.AI_MODEL_NAME) {
        return process.env.AI_MODEL_NAME;
    }

    return DEFAULT_MODELS[provider];
}

function getProviderPriority(): AIProvider[] {
    const configured = normalizeProvider(process.env.AI_PROVIDER);
    return [configured, ...PROVIDERS.filter((provider) => provider !== configured)];
}

export function getModelSelection(): ModelSelection {
    const orderedProviders = getProviderPriority();
    const preferred = orderedProviders.find(
        (provider) => hasProviderKey(provider) && !quotaBlockedProviders.has(provider)
    ) ?? orderedProviders.find(hasProviderKey) ?? orderedProviders[0];

    const modelName = getPreferredModelName(preferred);

    return {
        provider: preferred,
        modelName,
        model: createProviderModel(preferred, modelName),
    };
}

export function markProviderQuotaExceeded(provider: AIProvider): void {
    quotaBlockedProviders.add(provider);
}

export function clearProviderQuotaBlock(provider: AIProvider): void {
    quotaBlockedProviders.delete(provider);
}

export function getQuotaBlockedProviders(): AIProvider[] {
    return Array.from(quotaBlockedProviders);
}
