import React from 'react';

const EarningsAnalytics = ({ earnings, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!earnings || !earnings.length) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <p className="text-gray-500 text-center">No earnings data available for this period.</p>
      </div>
    );
  }

  // Group earnings by date
  const earningsByDate = earnings.reduce((acc, earning) => {
    const date = earning.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        totalEarned: 0,
        totalPotential: 0,
        sessions: 0,
        attended: 0
      };
    }

    acc[date].sessions += 1;
    acc[date].totalPotential += earning.sessionFee;

    if (earning.attended) {
      acc[date].attended += 1;
      acc[date].totalEarned += earning.earned;
    }

    return acc;
  }, {});

  // Convert to array and sort by date
  const dailyEarnings = Object.values(earningsByDate).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Calculate the highest earning day
  const highestEarningDay = dailyEarnings.reduce((max, day) =>
    day.totalEarned > max.totalEarned ? day : max
  , { totalEarned: 0 });

  // Calculate the day with most sessions
  const mostSessionsDay = dailyEarnings.reduce((max, day) =>
    day.sessions > max.sessions ? day : max
  , { sessions: 0 });

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Analytics</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Detailed breakdown of your earnings for this period.
        </p>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Highest Earning Day */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Highest Earning Day
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{highestEarningDay.totalEarned.toFixed(2)}
                </dd>
                <dd className="mt-1 text-sm text-gray-500">
                  {new Date(highestEarningDay.date).toLocaleDateString()}
                </dd>
              </dl>
            </div>
          </div>

          {/* Day with Most Sessions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Most Sessions in a Day
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {mostSessionsDay.sessions}
                </dd>
                <dd className="mt-1 text-sm text-gray-500">
                  {new Date(mostSessionsDay.date).toLocaleDateString()}
                </dd>
              </dl>
            </div>
          </div>

          {/* Average Daily Earnings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Average Daily Earnings
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{(dailyEarnings.reduce((sum, day) => sum + day.totalEarned, 0) / dailyEarnings.length).toFixed(2)}
                </dd>
                <dd className="mt-1 text-sm text-gray-500">
                  For days with sessions
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Daily Earnings Table */}
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Earnings Breakdown</h4>
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sessions
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attended
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earned
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Potential
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyEarnings.map((day) => (
                        <tr key={day.date}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {day.sessions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {day.attended} ({Math.round(day.attended / day.sessions * 100)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{day.totalEarned.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{day.totalPotential.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsAnalytics;