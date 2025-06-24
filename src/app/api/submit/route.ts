import { neon } from '@neondatabase/serverless';

export default async function Page() {
  async function create(formData: FormData) {
    "use server";
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS comments (comment TEXT)`;
    const comment = formData.get("comment");
    await sql("INSERT INTO comments (comment) VALUES ($1)", [comment]);
  }
  return (
    <form action={create}>
      <input type="text" placeholder="write a comment" name="comment" />
      <button type="submit">Submit</button>
    </form>
  );
}