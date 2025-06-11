import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-950">
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">About</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Novia AI
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
              Our mission is to empower traders with professional analysis and insights for making informed decisions.
            </p>
          </div>
        </div>

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
        </div>
      </div>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Story</h2>
              <p className="mt-4 text-lg text-gray-400">
                Novia AI was founded in 2020 by a team of professional traders and financial analysts with decades of
                combined experience in the financial markets.
              </p>
              <p className="mt-4 text-lg text-gray-400">
                We noticed that while there was abundant market data available, many traders struggled to interpret it
                effectively. That's when we decided to build a platform that delivers expert analysis directly to
                traders, helping them make sense of market movements and identify profitable opportunities.
              </p>
              <p className="mt-4 text-lg text-gray-400">
                Today, Novia AI serves thousands of traders worldwide, from beginners to seasoned professionals, all
                looking for an edge in today's competitive markets.
              </p>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-gray-800">
              <Image src={"./logo.jpeg"} alt="Website Logo" fill />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Our Team
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Meet the financial experts and technology specialists who make Novia AI possible.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Alex Morgan",
                role: "Chief Executive Officer",
                bio: "Former hedge fund manager with 15+ years of experience in global markets.",
              },
              {
                name: "Sarah Chen",
                role: "Chief Analyst",
                bio: "Certified Financial Analyst specializing in technical and fundamental analysis.",
              },
              {
                name: "Michael Lee",
                role: "Head of Technology",
                bio: "Tech veteran with a background in fintech and algorithmic trading systems.",
              },
              {
                name: "Jessica Williams",
                role: "Forex Specialist",
                bio: "Expert in currency markets with experience at major investment banks.",
              },
              {
                name: "David Kim",
                role: "Cryptocurrency Analyst",
                bio: "Early crypto adopter and blockchain technology specialist.",
              },
              {
                name: "Rachel Martinez",
                role: "Customer Success",
                bio: "Dedicated to ensuring traders get the most value from our analysis.",
              },
            ].map((member, index) => (
              <div
                key={index}
                className="rounded-xl bg-gray-950 border border-gray-800 p-6 hover:border-gray-700 transition-colors"
              >
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 mb-4" />
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-sm text-blue-400 mb-2">{member.role}</p>
                <p className="text-gray-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Our Values
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              These principles guide our work and define our commitment to our customers.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Accuracy",
                description:
                  "We're committed to providing precise, reliable analysis that traders can depend on for their decision-making.",
              },
              {
                title: "Transparency",
                description:
                  "We're clear about our methodologies and honest about market uncertainties so traders can assess risks properly.",
              },
              {
                title: "Education",
                description:
                  "Beyond just providing analysis, we aim to help traders understand the markets and improve their own skills.",
              },
              {
                title: "Innovation",
                description:
                  "We continuously refine our analytical methods and technology to deliver the best possible insights.",
              },
              {
                title: "Integrity",
                description: "We maintain the highest ethical standards in all our operations and market commentary.",
              },
              {
                title: "Customer Focus",
                description:
                  "Our ultimate measure of success is how well we help our customers achieve their trading goals.",
              },
            ].map((value, index) => (
              <div key={index} className="rounded-xl bg-gray-950 border border-gray-800 p-6">
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl max-w-2xl mx-auto">
            Ready to elevate your trading with expert analysis?
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of traders who rely on Novia AI for market insights.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
