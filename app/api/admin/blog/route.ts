import { readBlogFile, writeBlogFile } from "@/lib/admin/data-io";
import { BlogPostSchema } from "@/lib/types";

export async function GET() {
  const { posts } = readBlogFile();
  const sorted = [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return Response.json(sorted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = BlogPostSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 });
  }
  const data = readBlogFile();
  if (data.posts.some((p) => p.id === result.data.id)) {
    return Response.json({ error: "ID ya existe" }, { status: 409 });
  }
  data.posts.push(result.data);
  writeBlogFile(data);
  return Response.json(result.data, { status: 201 });
}
