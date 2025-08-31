// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const filename = `${session.user.id}_${timestamp}${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory already exists or can't be created
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    
    await writeFile(filePath, buffer);

    // Return the file URL
    const fileUrl = `/uploads/kyc/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: filename
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}