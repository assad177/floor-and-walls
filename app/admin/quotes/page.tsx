import { prisma } from "@/lib/prisma";
import QuoteStatusDropdown from "./QuoteStatusDropdown";
import { FiCalendar, FiUser, FiPhone, FiFileText } from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Leads</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your fitting requests and orders.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-sm border border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Leads</span>
            <span className="text-2xl font-bold text-navy">{quotes.length}</span>
          </div>
        </div>
      </div>

      {/* Modern Table Section */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="p-5">Customer Info</th>
                <th className="p-5">Order Details</th>
                <th className="p-5">Date</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <FiFileText className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                    <p className="text-lg font-bold text-gray-800">No quotes yet</p>
                    <p className="text-sm text-gray-500 mt-1">When customers request a fitting, they will appear here.</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="transition-colors hover:bg-gray-50/50 group">
                    <td className="p-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy">
                          <FiUser className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{quote.customerName}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                            <FiPhone className="h-3.5 w-3.5" />
                            <span>{quote.customerPhone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <div className="max-w-md rounded-xl bg-gray-50 p-3.5 text-sm text-gray-700 leading-relaxed border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                        {quote.designDetails || "No details provided"}
                      </div>
                    </td>
                    <td className="p-5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                        <FiCalendar className="h-4 w-4 text-gray-400" />
                        {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="p-5 align-top">
                      <QuoteStatusDropdown id={quote.id} currentStatus={quote.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}