import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, Users, Heart, MessageCircle, Share, Play, Clock, Globe } from 'lucide-react';
import Papa from 'papaparse';

const TikTokAnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await window.fs.readFile('dataset_tiktok-scraper_2025-05-27_17-51-09-863.csv', { encoding: 'utf8' });
        
        const parsed = Papa.parse(csvData, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });

        const processedData = parsed.data.map(row => ({
          id: row.id,
          author: row['authorMeta/nickName'] || row['authorMeta/name'] || 'Unknown',
          followers: parseInt(row['authorMeta/fans']) || 0,
          following: parseInt(row['authorMeta/following']) || 0,
          hearts: parseInt(row['authorMeta/heart']) || 0,
          playCount: parseInt(row.playCount) || 0,
          diggCount: parseInt(row.diggCount) || 0,
          commentCount: parseInt(row.commentCount) || 0,
          shareCount: parseInt(row.shareCount) || 0,
          duration: parseInt(row['videoMeta/duration']) || 0,
          text: row.text || '',
          language: row.textLanguage || 'unknown',
          createTime: row.createTimeISO ? new Date(row.createTimeISO) : new Date(),
          hashtags: [
            row['hashtags/0/name'],
            row['hashtags/1/name'],
            row['hashtags/2/name'],
            row['hashtags/3/name'],
            row['hashtags/4/name'],
            row['hashtags/5/name'],
            row['hashtags/6/name']
          ].filter(Boolean),
          verified: row['authorMeta/verified'] === 'true'
        }));

        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-white text-xl">Analyse des données TikTok en cours...</p>
        </div>
      </div>
    );
  }

  // Calculs des métriques
  const totalVideos = data.length;
  const totalViews = data.reduce((sum, item) => sum + item.playCount, 0);
  const totalLikes = data.reduce((sum, item) => sum + item.diggCount, 0);
  const totalComments = data.reduce((sum, item) => sum + item.commentCount, 0);
  const totalShares = data.reduce((sum, item) => sum + item.shareCount, 0);
  const avgEngagement = data.length > 0 ? (totalLikes + totalComments + totalShares) / totalVideos : 0;

  // Top créateurs par engagement
  const topCreators = data
    .map(item => ({
      name: item.author,
      followers: item.followers,
      engagement: item.diggCount + item.commentCount + item.shareCount,
      views: item.playCount
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Distribution des langues
  const languageData = data.reduce((acc, item) => {
    const lang = item.language === 'un' ? 'Non défini' : 
                 item.language === 'fr' ? 'Français' : 
                 item.language === 'eng-US' ? 'Anglais' : item.language;
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const languageChartData = Object.entries(languageData).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / totalVideos) * 100).toFixed(1)
  }));

  // Analyse temporelle
  const timeData = data.map(item => ({
    time: item.createTime.getHours(),
    engagement: item.diggCount + item.commentCount + item.shareCount,
    views: item.playCount
  }));

  const hourlyEngagement = timeData.reduce((acc, item) => {
    const hour = item.time;
    if (!acc[hour]) acc[hour] = { hour, totalEngagement: 0, count: 0 };
    acc[hour].totalEngagement += item.engagement;
    acc[hour].count += 1;
    return acc;
  }, {});

  const hourlyData = Object.values(hourlyEngagement).map(item => ({
    hour: `${item.hour}h`,
    avgEngagement: Math.round(item.totalEngagement / item.count)
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  // Corrélation vues vs engagement
  const correlationData = data.map(item => ({
    views: item.playCount,
    engagement: item.diggCount + item.commentCount + item.shareCount,
    followers: item.followers
  })).filter(item => item.views > 0 && item.engagement > 0);

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
    <div className={`p-6 rounded-2xl ${gradient} text-white transform hover:scale-105 transition-all duration-300 shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs opacity-70">{subtitle}</p>
        </div>
        <Icon className="w-12 h-12 opacity-80" />
      </div>
    </div>
  );

  const TabButton = ({ id, title, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
        active 
          ? 'bg-purple-600 text-white shadow-lg' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {title}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Analyse TikTok - Tag "Pour Toi"
          </h1>
          <p className="text-xl text-gray-300">Dashboard d'analyse des performances et tendances</p>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={Play}
            title="Total Vidéos"
            value={totalVideos.toLocaleString()}
            subtitle="Échantillon analysé"
            gradient="bg-gradient-to-br from-purple-600 to-purple-800"
          />
          <StatCard
            icon={Users}
            title="Vues Totales"
            value={`${(totalViews / 1000000).toFixed(1)}M`}
            subtitle="Portée totale"
            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          <StatCard
            icon={Heart}
            title="Likes Totaux"
            value={totalLikes.toLocaleString()}
            subtitle="Engagement positif"
            gradient="bg-gradient-to-br from-pink-600 to-pink-800"
          />
          <StatCard
            icon={MessageCircle}
            title="Commentaires"
            value={totalComments.toLocaleString()}
            subtitle="Interactions"
            gradient="bg-gradient-to-br from-green-600 to-green-800"
          />
          <StatCard
            icon={TrendingUp}
            title="Engagement Moyen"
            value={Math.round(avgEngagement).toLocaleString()}
            subtitle="Par vidéo"
            gradient="bg-gradient-to-br from-orange-600 to-orange-800"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 justify-center">
          <TabButton
            id="overview"
            title="Vue d'ensemble"
            active={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="creators"
            title="Top Créateurs"
            active={activeTab === 'creators'}
            onClick={setActiveTab}
          />
          <TabButton
            id="temporal"
            title="Analyse Temporelle"
            active={activeTab === 'temporal'}
            onClick={setActiveTab}
          />
          <TabButton
            id="correlation"
            title="Corrélations"
            active={activeTab === 'correlation'}
            onClick={setActiveTab}
          />
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribution des langues */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Globe className="mr-3" />
                Distribution des Langues
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={languageChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {languageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Métriques d'engagement */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Métriques Détaillées</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">Taux d'engagement moyen</span>
                  <span className="text-purple-400 font-bold">
                    {totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">Ratio Likes/Vues</span>
                  <span className="text-blue-400 font-bold">
                    {totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">Ratio Commentaires/Likes</span>
                  <span className="text-green-400 font-bold">
                    {totalLikes > 0 ? (totalComments / totalLikes * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">Ratio Partages/Vues</span>
                  <span className="text-orange-400 font-bold">
                    {totalViews > 0 ? (totalShares / totalViews * 100).toFixed(2) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Top 5 Créateurs par Engagement</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCreators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement Total" />
                <Bar dataKey="followers" fill="#06b6d4" name="Followers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'temporal' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="mr-3" />
              Engagement par Heure de Publication
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgEngagement" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                  name="Engagement Moyen"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'correlation' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Corrélation Vues vs Engagement</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="views" 
                  stroke="#9CA3AF"
                  name="Vues"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <YAxis 
                  dataKey="engagement" 
                  stroke="#9CA3AF"
                  name="Engagement"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value, name) => [
                    name === 'views' ? `${value.toLocaleString()} vues` :
                    name === 'engagement' ? `${value.toLocaleString()} interactions` :
                    `${value.toLocaleString()} followers`,
                    name === 'views' ? 'Vues' :
                    name === 'engagement' ? 'Engagement' : 'Followers'
                  ]}
                />
                <Scatter dataKey="engagement" fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <h4 className="text-xl font-bold text-white mb-4">Insights Clés</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <strong className="text-purple-400">Engagement:</strong> Le taux d'engagement moyen est de {totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0}%, indiquant une audience active.
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <strong className="text-blue-400">Contenu:</strong> {languageChartData[0]?.name} représente {languageChartData[0]?.percentage}% du contenu analysé.
              </div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <strong className="text-green-400">Performance:</strong> Les créateurs avec le plus d'engagement génèrent en moyenne {Math.round(topCreators[0]?.engagement || 0).toLocaleString()} interactions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokAnalyticsDashboard;
