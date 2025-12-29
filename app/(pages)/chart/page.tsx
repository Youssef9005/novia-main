import InteractiveChart from "@/components/InteractiveChart";
import SignalList from "@/components/SignalList";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function ChartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px] lg:h-[calc(100vh-140px)]">
          <div className="lg:col-span-3 h-full border rounded-lg overflow-hidden shadow-sm bg-card">
            <InteractiveChart symbol="XAUUSD" />
          </div>
          <div className="lg:col-span-1 h-full">
            <SignalList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
