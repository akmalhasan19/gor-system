import { createTools } from '@/lib/ai/tools';
import { getModelSelection, markProviderQuotaExceeded } from '@/lib/ai/model-factory';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';

export const maxDuration = 30;

type NormalizedError = {
    message: string;
    code?: string;
    type?: string;
};

function normalizeAiError(error: unknown): NormalizedError {
    const fallback: NormalizedError = { message: 'Internal Server Error' };

    if (!error) return fallback;

    const fromObject = (value: unknown): NormalizedError | null => {
        if (!value || typeof value !== 'object') return null;

        const record = value as Record<string, unknown>;
        const nestedError = record.error && typeof record.error === 'object'
            ? (record.error as Record<string, unknown>)
            : null;

        const code = String(nestedError?.code ?? record.code ?? '');
        const type = String(nestedError?.type ?? record.type ?? '');
        const messageValue = nestedError?.message ?? record.message;
        const message = typeof messageValue === 'string' && messageValue.trim().length > 0
            ? messageValue
            : fallback.message;

        return {
            message,
            code: code || undefined,
            type: type || undefined,
        };
    };

    if (typeof error === 'string') {
        try {
            const parsed = JSON.parse(error);
            return fromObject(parsed) ?? { message: error };
        } catch {
            return { message: error };
        }
    }

    if (error instanceof Error) {
        const message = error.message || fallback.message;
        try {
            const parsed = JSON.parse(message);
            return fromObject(parsed) ?? { message };
        } catch {
            return fromObject(error) ?? { message };
        }
    }

    return fromObject(error) ?? fallback;
}

function isInsufficientQuota(error: NormalizedError): boolean {
    return error.code === 'insufficient_quota' || error.type === 'insufficient_quota';
}

function toUserFacingErrorMessage(error: NormalizedError): string {
    if (isInsufficientQuota(error)) {
        return 'Kuota AI provider saat ini habis. Silakan isi billing API atau ganti AI provider di environment.';
    }

    return error.message;
}

export async function POST(req: Request) {
    const selection = getModelSelection();

    try {
        const { messages, venueId } = await req.json();

        if (!venueId) {
            return new Response('Missing venueId', { status: 400 });
        }

        const tools = createTools(venueId);
        const modelMessages = await convertToModelMessages(messages);

        const result = streamText({
            model: selection.model,
            system: `You are a helpful AI operation assistant for a sports venue (Gor Management System).
      
      Your goal is to help the venue manager/admin with daily tasks like checking schedule availability, making bookings, and managing the queue.
      
      Rules:
      1. Always be polite and professional.
      2. If you are making a booking, always ask for confirmation of the price and details before calling the tool, unless the user explicitly provided all details and asked to "just do it".
      3. Format available slots in a readable list or table.
      4. Current Venue ID: ${venueId}.
      5. Assume current date is ${new Date().toLocaleDateString('en-CA')} if not specified.
      `,
            messages: modelMessages,
            tools,
            stopWhen: stepCountIs(5),
        });

        return result.toUIMessageStreamResponse({
            onError: (error) => {
                const normalized = normalizeAiError(error);

                if (isInsufficientQuota(normalized)) {
                    markProviderQuotaExceeded(selection.provider);
                }

                return toUserFacingErrorMessage(normalized);
            },
        });
    } catch (error: unknown) {
        const normalized = normalizeAiError(error);
        if (isInsufficientQuota(normalized)) {
            markProviderQuotaExceeded(selection.provider);
        }

        console.error('AI Error:', normalized, { provider: selection.provider, model: selection.modelName });

        return new Response(toUserFacingErrorMessage(normalized), { status: 500 });
    }
}
