import { readBlogFile, writeBlogFile } from "@/lib/admin/data-io";
import { BlogPostSchema } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = readBlogFile().posts.find((p) => p.id === id);
  if (!post) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(post);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const result = BlogPostSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readBlogFile();
  const idx = data.posts.findIndex((p) => p.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.posts[idx] = result.data;
  writeBlogFile(data);
  return Response.json(result.data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = readBlogFile();
  const idx = data.posts.findIndex((p) => p.id === id);
  if (idx === -1) return Response.json({ error: "No encontrado" }, { status: 404 });
  data.posts.splice(idx, 1);
  writeBlogFile(data);
  return new Response(null, { status: 204 });
}
