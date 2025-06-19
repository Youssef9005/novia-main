import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageSquare, Map, Phone } from "lucide-react"
import Image from "next/image"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-950">
      <div className="relative pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">Contact</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Get in touch
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
              Have questions? We're here to help. Reach out to our team for support, inquiries, or feedback.
            </p>
          </div>
        </div>

        <div className="absolute -top-24 left-1/2 -translate-x-1/2 transform opacity-20 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-blue-500 to-emerald-500" />
        </div>
      </div>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        placeholder="Enter your first name"
                        className="bg-gray-900 border-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input
                        id="last-name"
                        placeholder="Enter your last name"
                        className="bg-gray-900 border-gray-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="bg-gray-900 border-gray-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="What's this regarding?" className="bg-gray-900 border-gray-800" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      className="min-h-[150px] bg-gray-900 border-gray-800"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send message
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-gray-800 bg-gray-950/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Contact information</CardTitle>
                  <CardDescription>Here's how you can reach us directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Mail className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-sm text-gray-400">info@novia-ai.com</p>
                      <p className="text-sm text-gray-400">support@novia-ai.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-emerald-500 mt-1" />
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-sm text-gray-400">+90 534 486 92 20</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Map className="h-6 w-6 text-purple-500 mt-1" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-gray-400">
                        Turkey istanbul
                        <br />
                        Egypt Cairo
                        <br />
                        Bahrain
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
