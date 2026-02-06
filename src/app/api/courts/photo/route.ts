import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key for upload permissions
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const courtId = formData.get('courtId') as string;
        const venueId = formData.get('venueId') as string; // Optional: for organizing folders

        if (!file || !courtId) {
            return NextResponse.json({ error: 'File and Court ID are required' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        // Use a structure like courts/{courtId}-{timestamp}.{ext} to keep it organized
        const fileName = `courts/${courtId}-${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage (using venue-photos bucket)
        const { data, error } = await supabase.storage
            .from('venue-photos')
            .upload(fileName, file, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('Upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('venue-photos')
            .getPublicUrl(fileName);

        // Update Court Record
        const { error: updateError } = await supabase
            .from('courts')
            .update({ photo_url: publicUrl })
            .eq('id', courtId);

        if (updateError) {
            console.error('Court update error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            photoUrl: publicUrl
        });

    } catch (error: any) {
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
