import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../src/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/collections - List collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'quality';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase.from('collections').select('*', { count: 'exact' });

    // Filter by category if provided (check manifest)
    if (category) {
      query = query.filter('manifest->categories', 'cs', `{${category}}`);
    }

    // Sort options
    switch (sort) {
      case 'quality':
        query = query.order('quality_score', { ascending: false }).order('rating_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('rating_count', { ascending: false });
        break;
      default:
        query = query.order('quality_score', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch collections', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      collections: data || [],
      total: count || 0,
      offset,
      limit,
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

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { manifest, ipfsHash, authorAddress, signature, message } = body;

    if (!manifest || !ipfsHash || !authorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: manifest, ipfsHash, authorAddress' },
        { status: 400 }
      );
    }

    // Validate manifest structure
    if (!manifest.name || !manifest.version || !manifest.description) {
      return NextResponse.json(
        { error: 'Invalid manifest: missing name, version, or description' },
        { status: 400 }
      );
    }

    // Convert name to kebab-case ID
    const collectionId = manifest.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 64);

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Invalid collection name' },
        { status: 400 }
      );
    }

    // Check if collection already exists
    const { data: existing } = await supabase
      .from('collections')
      .select('id, version')
      .eq('id', collectionId)
      .single();

    // Prepare collection data
    const collectionData = {
      id: collectionId,
      manifest,
      ipfs_hash: ipfsHash,
      author_address: authorAddress.toLowerCase(),
      version: manifest.version,
      doc_count: manifest.docCount || 0,
    };

    if (existing) {
      // Update existing collection (new version)
      const { data, error } = await supabase
        .from('collections')
        .update(collectionData)
        .eq('id', collectionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating collection:', error);
        return NextResponse.json(
          { error: 'Failed to update collection', details: error.message },
          { status: 500 }
        );
      }

      // Add to version history
      await supabase.from('collection_versions').insert({
        collection_id: collectionId,
        version: manifest.version,
        ipfs_hash: ipfsHash,
        manifest,
      });

      return NextResponse.json({
        ...data,
        cacheStatus: 'fresh',
        message: 'Collection updated successfully',
      });
    } else {
      // Create new collection
      const { data, error } = await supabase
        .from('collections')
        .insert(collectionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating collection:', error);
        return NextResponse.json(
          { error: 'Failed to create collection', details: error.message },
          { status: 500 }
        );
      }

      // Add initial version
      await supabase.from('collection_versions').insert({
        collection_id: collectionId,
        version: manifest.version,
        ipfs_hash: ipfsHash,
        manifest,
      });

      return NextResponse.json({
        ...data,
        cacheStatus: 'fresh',
        message: 'Collection created successfully',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
