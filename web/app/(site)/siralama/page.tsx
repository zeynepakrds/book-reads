import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PageHeader } from "@/components/PageHeader";
import { container } from "@/components/ui";
import { getCurrentUser, getLeaderboardPlayers } from "@/lib/server/users";

export const metadata: Metadata = {
  title: "Sıralama",
  description: "Haftalık ve tüm zamanların en iyi okurları.",
};

export default async function LeaderboardPage() {
  const [players, user] = await Promise.all([getLeaderboardPlayers(), getCurrentUser()]);
  return (
    <div className={`${container} py-12 sm:py-16`}>
      <PageHeader
        icon={Trophy}
        tone="#d99a0b"
        title="Sıralama"
        description="Meydan okuma ve düellolardan kazanılan XP ile sıralanırsın. Haftalık sıralama her pazartesi sıfırlanır."
      />
      <div className="mx-auto mt-10 max-w-3xl">
        <LeaderboardTable players={players} meId={user ? `u:${user.username}` : undefined} />
      </div>
    </div>
  );
}
