import { Zap, BarChart, Users, Quote } from "lucide-react"

export function AuthPromo() {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50 p-12 text-white">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Unlock the Power of AI for Your Finances
        </h1>
        <p className="text-lg text-gray-600">
          Our intelligent accounting platform helps you manage your business finances with ease and precision.
        </p>
        <ul className="space-y-4">
          <li className="flex items-start">
            <div className="p-2 bg-white rounded-full mr-4">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Automated Bookkeeping</h3>
              <p className="text-gray-600">Save time and reduce errors with our AI-powered transaction categorization and reconciliation.</p>
            </div>
          </li>
          <li className="flex items-start">
            <div className="p-2 bg-white rounded-full mr-4">
              <BarChart className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Real-time Financial Insights</h3>
              <p className="text-gray-600">Get a clear view of your financial health with our interactive dashboards and reports.</p>
            </div>
          </li>
          <li className="flex items-start">
            <div className="p-2 bg-white rounded-full mr-4">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Collaborate with Your Team</h3>
              <p className="text-gray-600">Invite your accountant and team members to collaborate securely in one place.</p>
            </div>
          </li>
        </ul>
        <div className="pt-8">
          <blockquote className="border-l-4 border-purple-500 pl-4">
            <p className="text-lg text-gray-700 italic">
              "This platform has transformed how we manage our finances. 
            </p>
            <cite className="mt-2 block text-right font-semibold text-gray-800">- Awais Zegham, CEO of a Bstream</cite>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
