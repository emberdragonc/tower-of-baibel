import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/collections/[id] - Get a specific collection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection not found', cacheStatus: 'empty' },
          { status: 404 }
        );
      }
      console.error('Error fetching collection:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collection', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Collection not found', cacheStatus: 'empty' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...data,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.ipfs_hash}`,
      cacheStatus: 'fresh',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
