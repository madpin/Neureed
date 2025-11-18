import { auth } from "@/src/lib/auth";
import { deactivateAllThemes } from "@/src/lib/services/theme-service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deactivateAllThemes(session.user.id);

    return Response.json({
      success: true,
      message: "All themes deactivated",
    });
  } catch (error) {
    console.error("Deactivate themes error:", error);
    return Response.json(
      { error: "Failed to deactivate themes" },
      { status: 500 }
    );
  }
}
