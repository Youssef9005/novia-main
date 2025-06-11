export default function TestPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a simple test page to verify that the footer is visible.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Card {i + 1}</h2>
            <p>This is a sample card to add content to the page.</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Footer Visibility Test</h2>
        <p className="mb-4">
          This page is designed to test if the footer is properly displayed at the bottom of the page. If you can see a
          red debug footer below this content, then the footer is working correctly.
        </p>
      </div>
    </div>
  )
}
