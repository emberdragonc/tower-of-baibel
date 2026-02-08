import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../src/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/search?q=query - Search across docs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const collectionId = searchParams.get('collection');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing search query (q parameter)' },
        { status: 400 }
      );
    }

    // Build the search query using full-text search
    let dbQuery = supabase
      .from('docs')
      .select(`
        id,
        collection_id,
        filename,
        title,
        category,
        tags,
        collections!inner(id, manifest)
      `, { count: 'exact' });

    // Apply full-text search
    const searchQuery = query.trim().split(/\s+/).join(' & ');
    dbQuery = dbQuery.textSearch('search_vector', searchQuery, {
      type: 'plain',
      config: 'english',
    });

    // Filter by collection if provided
    if (collectionId) {
      dbQuery = dbQuery.eq('collection_id', collectionId);
    }

    // Filter by category if provided
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    dbQuery = dbQuery.limit(limit);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Error searching docs:', error);
      return NextResponse.json(
        { error: 'Failed to search docs', details: error.message },
        { status: 500 }
      );
    }

    // Transform results
    const results = (data || []).map((doc: any) => ({
      docId: doc.id,
      collectionId: doc.collection_id,
      title: doc.title,
      category: doc.category,
      excerpt: `Found in ${doc.collection_id}/${doc.filename}`,
      score: 1.0, // Full-text search doesn't return scores directly
    }));

    return NextResponse.json({
      query: query.trim(),
      results,
      total: count || 0,
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
