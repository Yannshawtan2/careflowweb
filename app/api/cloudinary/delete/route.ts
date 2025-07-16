import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      )
    }

    // Check if Cloudinary environment variables are set
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary environment variables not set, skipping image deletion')
      return NextResponse.json({ 
        success: true, 
        message: 'Image deletion skipped - Cloudinary credentials not configured' 
      })
    }

    // Import cloudinary only if we have the credentials
    const { v2: cloudinary } = await import('cloudinary')
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Image deleted successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete image from Cloudinary' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error deleting image from Cloudinary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}
