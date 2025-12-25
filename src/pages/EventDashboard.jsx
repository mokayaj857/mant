import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, CheckCircle, MessageSquare, BarChart3, 
  TrendingUp, Eye, UserCheck, Clock, MapPin, Ticket, X
} from 'lucide-react';

const EventDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    setIsVisible(true);
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  // Dummy event data
  const eventData = {
    id: eventId,
    name: 'Tech Conference 2025',
    date: '2025-06-10',
    venue: 'Convention Center, Downtown',
    description: 'A premier technology conference bringing together industry leaders and innovators.',
    totalTickets: 200,
    soldTickets: 150,
    revenue: '45.5 AVAX',
    status: 'Upcoming'
  };

  // Dummy guests data
  const [allGuests, setAllGuests] = useState([
    { id: 1, name: 'Alice Johnson', wallet: '0x1234...5678', ticketType: 'VIP', checkedIn: false },
    { id: 2, name: 'Bob Smith', wallet: '0x8765...4321', ticketType: 'Regular', checkedIn: false },
    { id: 3, name: 'Carol White', wallet: '0xabcd...efgh', ticketType: 'VVIP', checkedIn: false },
    { id: 4, name: 'David Brown', wallet: '0x9876...1234', ticketType: 'VIP', checkedIn: false },
    { id: 5, name: 'Eve Davis', wallet: '0x5432...8765', ticketType: 'Regular', checkedIn: false }
  ]);

  const [comments, setComments] = useState([
    { id: 1, user: 'Alice Johnson', comment: 'Looking forward to this event!', time: '2 hours ago' },
    { id: 2, user: 'Bob Smith', comment: 'Will there be parking available?', time: '5 hours ago' }
  ]);

  const checkedInGuests = allGuests.filter(guest => guest.checkedIn);

  const handleCheckIn = (guestId) => {
    setAllGuests(prevGuests =>
      prevGuests.map(guest =>
        guest.id === guestId ? { ...guest, checkedIn: true } : guest
      )
    );
  };

  const handleCheckOut = (guestId) => {
    setAllGuests(prevGuests =>
      prevGuests.map(guest =>
        guest.id === guestId ? { ...guest, checkedIn: false } : guest
      )
    );
  };

  const tabs = [
    { id: 'general', label: 'General / Post Event Analysis', icon: BarChart3 },
    { id: 'allGuests', label: 'All Guests', icon: Users },
    { id: 'checkedIn', label: 'Checked In Guests', icon: CheckCircle },
    { id: 'comments', label: 'Comments', icon: MessageSquare }
  ];

  const StatCard = ({ icon: Icon, label, value, color = 'purple' }) => (
    <div className="group p-3 sm:p-4 bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30
      hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-${color}-600/20 flex items-center justify-center
          group-hover:scale-110 transition-transform flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-400`} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );

  const GuestRow = ({ guest, showCheckIn = true }) => (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-black/40 backdrop-blur-xl
      rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 gap-3">
      <div className="flex items-center space-x-3 flex-1 w-full sm:w-auto">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600
          flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">{guest.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{guest.name}</h4>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <span className="font-mono truncate">{guest.wallet}</span>
            <span className={`px-2 py-0.5 rounded-full flex-shrink-0 ${
              guest.ticketType === 'VVIP' ? 'bg-yellow-500/20 text-yellow-400' :
              guest.ticketType === 'VIP' ? 'bg-blue-500/20 text-blue-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {guest.ticketType}
            </span>
          </div>
        </div>
      </div>
      {showCheckIn && !guest.checkedIn && (
        <button
          onClick={() => handleCheckIn(guest.id)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 border
            border-green-500/30 text-xs sm:text-sm text-green-400 flex items-center justify-center space-x-2
            transition-all duration-300"
        >
          <UserCheck className="w-4 h-4" />
          <span>Check In</span>
        </button>
      )}
      {!showCheckIn && guest.checkedIn && (
        <button
          onClick={() => handleCheckOut(guest.id)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border
            border-red-500/30 text-xs sm:text-sm text-red-400 flex items-center justify-center space-x-2
            transition-all duration-300"
        >
          <X className="w-4 h-4" />
          <span>Remove</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Particle Background */}
      <div className="fixed inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `rgba(147, 51, 234, 0.6)`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `-${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Event Header */}
          <div className={`transition-all duration-1000 mb-6
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400
                    bg-clip-text text-transparent">
                    {eventData.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{eventData.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate max-w-[150px] sm:max-w-none">{eventData.venue}</span>
                    </div>
                    <span className="px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                      {eventData.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300">{eventData.description}</p>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30
                    border border-purple-500/30 text-xs sm:text-sm text-purple-400 transition-all duration-300"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`mb-6 transition-all duration-1000 delay-100
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg whitespace-nowrap
                    transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-black/40 backdrop-blur-xl border border-purple-500/30 text-gray-400 hover:text-white hover:border-purple-500/50'
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={`transition-all duration-700 delay-200
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

            {/* General / Post Event Analysis Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard icon={Ticket} label="Total Tickets" value={eventData.totalTickets} />
                  <StatCard icon={TrendingUp} label="Sold Tickets" value={eventData.soldTickets} color="blue" />
                  <StatCard icon={CheckCircle} label="Checked In" value={checkedInGuests.length} color="green" />
                  <StatCard icon={Eye} label="Revenue" value={eventData.revenue} color="yellow" />
                </div>

                <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <span>Event Analytics</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Ticket Sales Progress</span>
                        <span className="text-white font-semibold">
                          {Math.round((eventData.soldTickets / eventData.totalTickets) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-1000"
                          style={{ width: `${(eventData.soldTickets / eventData.totalTickets) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Check-in Rate</span>
                        <span className="text-white font-semibold">
                          {Math.round((checkedInGuests.length / eventData.soldTickets) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-1000"
                          style={{ width: `${(checkedInGuests.length / eventData.soldTickets) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-6">
                    <h4 className="text-sm font-semibold text-white mb-3">Ticket Distribution</h4>
                    <div className="space-y-2">
                      {['Regular', 'VIP', 'VVIP'].map((type) => {
                        const count = allGuests.filter(g => g.ticketType === type).length;
                        return (
                          <div key={type} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{type}</span>
                            <span className="text-white font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-6">
                    <h4 className="text-sm font-semibold text-white mb-3">Quick Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Remaining Tickets</span>
                        <span className="text-white font-semibold">
                          {eventData.totalTickets - eventData.soldTickets}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pending Check-ins</span>
                        <span className="text-white font-semibold">
                          {eventData.soldTickets - checkedInGuests.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Guests Tab */}
            {activeTab === 'allGuests' && (
              <div className="space-y-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span>All Guests ({allGuests.length})</span>
                    </h3>
                    <div className="text-sm text-gray-400">
                      {allGuests.filter(g => !g.checkedIn).length} pending check-in
                    </div>
                  </div>
                  <div className="space-y-2">
                    {allGuests.map((guest) => (
                      <GuestRow key={guest.id} guest={guest} showCheckIn={true} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Checked In Guests Tab */}
            {activeTab === 'checkedIn' && (
              <div className="space-y-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>Checked In Guests ({checkedInGuests.length})</span>
                    </h3>
                  </div>
                  {checkedInGuests.length > 0 ? (
                    <div className="space-y-2">
                      {checkedInGuests.map((guest) => (
                        <GuestRow key={guest.id} guest={guest} showCheckIn={false} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No guests checked in yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <span>Comments ({comments.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600
                              flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {comment.user.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{comment.user}</p>
                              <p className="text-xs text-gray-400">{comment.time}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 ml-10">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDashboard;

