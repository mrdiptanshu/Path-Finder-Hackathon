/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  CloudSun, 
  Bug, 
  TrendingUp, 
  User, 
  Menu, 
  X, 
  Camera, 
  Upload, 
  Languages, 
  Moon, 
  Sun, 
  LogOut, 
  History, 
  Bell,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Info,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { translations } from './translations';
import { auth, signInWithGoogle, logout, getUserProfile, saveUserProfile, db, saveScan, getUserScans, UserProfile, ScanRecord } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { analyzeCrop } from './services/gemini';

// --- Sub-components (Simplified for main file inclusion) ---

export default function App() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [city, setCity] = useState('Delhi');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userProfile = await getUserProfile(authUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setLang(userProfile.preferredLanguage);
          setTheme(userProfile.theme);
        } else {
          const newProfile: UserProfile = {
            uid: authUser.uid,
            displayName: authUser.displayName || '',
            email: authUser.email || '',
            preferredLanguage: 'en',
            theme: 'light',
            notificationsEnabled: true
          };
          setProfile(newProfile);
          await saveUserProfile(newProfile);
        }
        loadScans(authUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    // Default weather for Delhi
    fetchWeather('Delhi');

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const loadScans = async (uid: string) => {
    const userScans = await getUserScans(uid);
    setScans(userScans);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        alert("The sign-in popup was closed before completion. Please try again and keep the popup open until finished.");
      } else {
        alert("Login failed. This may be due to browser popup blocking. Please ensure popups are allowed or try opening the app in a new tab.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('home');
  };

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    if (profile) {
      const updated = { ...profile, preferredLanguage: newLang };
      setProfile(updated);
      saveUserProfile(updated);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (profile) {
      const updated = { ...profile, theme: newTheme };
      setProfile(updated);
      saveUserProfile(updated);
    }
  };

  const fetchWeather = async (cityName: string) => {
    // Simulated weather API call
    setWeather({
      temp: 28,
      condition: 'Sunny',
      humidity: 45,
      wind: 12,
      advisory: lang === 'hi' 
        ? "आज फसल की सिंचाई के लिए अच्छा समय है। तापमान स्थिर रहेगा।"
        : "Good time for irrigation today. Temperatures will remain stable."
    });
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-natural-bg text-natural-ink'}`}>
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-15 pointer-events-none grayscale-[0.5] mix-blend-multiply"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2664&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)'
        }}
      />
      
      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 shadow-sm transition-colors border-b ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-natural-primary text-white border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[60px] items-center">
            <div className="flex items-center gap-8 cursor-pointer" onClick={() => setActiveTab('home')}>
              {/* Desktop Links */}
              <div className="hidden lg:flex items-center gap-6 font-sans">
                {[
                  { id: 'detector', label: t.cameraDetector, icon: Bug },
                  { id: 'crops', label: t.cropGuide, icon: Sprout },
                  { id: 'weather', label: t.navWeather, icon: CloudSun },
                  { id: 'market', label: t.navMarket, icon: TrendingUp },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`text-[14px] font-medium transition-colors ${
                      activeTab === item.id 
                      ? 'text-natural-accent' 
                      : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative group">
                <div className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                  <Languages size={14} className="opacity-70" />
                  <select 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as any)}
                    className="bg-transparent border-none text-white focus:ring-0 cursor-pointer appearance-none pr-3"
                  >
                    <option value="en" className="text-zinc-900">EN</option>
                    <option value="hi" className="text-zinc-900">हिन्दी</option>
                    <option value="pa" className="text-zinc-900">ਪੰਜਾਬੀ</option>
                    <option value="bn" className="text-zinc-900">বাংলা</option>
                    <option value="te" className="text-zinc-900">తెలుగు</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-0 pointer-events-none opacity-60" />
                </div>
              </div>
              
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              
              {user ? (
                <button onClick={() => setActiveTab('profile')} className="w-8 h-8 rounded-full bg-natural-muted flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/20">
                  {user.photoURL ? <img src={user.photoURL} alt="profile" className="rounded-full" /> : user.displayName?.charAt(0)}
                </button>
              ) : (
                <button 
                  onClick={handleLogin} 
                  disabled={isLoggingIn}
                  className="natural-btn px-4 py-1.5 text-xs bg-natural-accent text-natural-primary border-none disabled:opacity-50"
                >
                  {isLoggingIn ? t.loading : t.login}
                </button>
              )}
              
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden overflow-hidden border-b ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-emerald-100'}`}
            >
              <div className="px-4 pt-2 pb-6 space-y-2">
                {['home', 'crops', 'weather', 'market', 'detector', 'profile'].map(id => (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setIsMenuOpen(false); }}
                    className={`block w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      activeTab === id 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {t[`nav${id.charAt(0).toUpperCase() + id.slice(1)}`] || id}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab !== 'home' && (
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 text-natural-muted mb-6 hover:text-natural-primary transition-colors font-bold text-sm uppercase tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <HomeSection t={t} user={user} onStart={(tabId) => setActiveTab(tabId || 'detector')} />}
            {activeTab === 'crops' && <CropsSection t={t} theme={theme} />}
            {activeTab === 'detector' && <DetectorSection t={t} user={user} lang={lang} onScanSaved={() => loadScans(user.uid)} />}
            {activeTab === 'weather' && <WeatherSection t={t} weather={weather} city={city} setCity={setCity} fetchWeather={fetchWeather} theme={theme} />}
            {activeTab === 'profile' && <ProfileSection t={t} user={user} profile={profile} hLogout={handleLogout} scans={scans} onUpdateProfile={setProfile} />}
            {activeTab === 'market' && <MarketSection t={t} theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-12 transition-colors ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border-t border-zinc-800' : 'bg-[#FAF9F6] text-natural-ink border-t border-natural-accent/20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[11px] uppercase font-bold tracking-[0.2em] text-natural-muted">The Heart of the Land</h4>
              <p className="text-[13px] leading-relaxed italic opacity-80">
                "Farming is not just a job, it's a heartbeat that connects the earth to our table. At Agrovista, we believe that the wisdom of the ancestors meets the precision of the future. Our technology is built to serve the hands that feed the world, ensuring that every seed has the strength to grow and every harvest tells a story of resilience."
              </p>
            </div>
            <div className="space-y-4 md:text-right">
              <h4 className="text-[11px] uppercase font-bold tracking-[0.2em] text-natural-muted">Cultivating Tomorrow</h4>
              <p className="text-[13px] leading-relaxed opacity-80">
                Modern agriculture requires a balance of intuition and intelligence. Our tools are designed to provide the clarity needed in the face of a changing climate, giving farmers the data to make decisions that honor the land while maximizing its potential.
              </p>
              <div className="pt-4 flex md:justify-end gap-6 text-[10px] uppercase font-bold tracking-widest text-natural-muted">
                <span>Sustainable Tech</span>
                <span>Earth-First Vision</span>
                <span>2026 Edition</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Section Components ---

function HomeSection({ t, user, onStart }: any) {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-emerald-100 dark:bg-emerald-950 rounded-full mb-4"
        >
          <Sprout className="w-12 h-12 text-emerald-600" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          {t.heroTitle}
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          {t.heroSub}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'crops', icon: Sprout, title: t.cropGuide, desc: "Full care tips & harvest times", color: "bg-orange-100/50 text-orange-700" },
          { id: 'weather', icon: CloudSun, title: t.weatherInfo, desc: "Live farming weather advisory", color: "bg-blue-100/50 text-blue-700" },
          { id: 'detector', icon: Bug, title: t.cameraDetector, desc: "AI-powered disease detection", color: "bg-emerald-100/50 text-emerald-700" },
          { id: 'market', icon: TrendingUp, title: t.marketPrice, desc: "Daily updated crop prices", color: "bg-purple-100/50 text-purple-700" },
        ].map((item, i) => (
          <div 
            key={i} 
            onClick={() => onStart(item.id)}
            className="p-6 natural-card cursor-pointer group"
          >
            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <h3 className="font-bold text-lg mb-1">{item.title}</h3>
            <p className="text-sm text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CropsSection({ t }: any) {
  const [selected, setSelected] = useState<any>(null);
  const crops = t.crops || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="section-title text-center block mb-8">{t.cropGuide}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {crops.map((c, i) => (
          <button 
            key={i} 
            onClick={() => setSelected(c)}
            className={`p-4 natural-card text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${selected?.name === c.name ? 'border-natural-muted ring-2 ring-natural-accent' : ''}`}
          >
            <Sprout className="text-natural-muted mb-2" size={18} />
            <h4 className="font-bold text-[13px]">{c.name}</h4>
          </button>
        ))}
      </div>

      {selected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="natural-card bg-[#FAF9F6] border-2 border-natural-accent/30 shadow-none space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-natural-muted rounded-[16px] flex items-center justify-center text-white">
              <Sprout size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{selected.name}</h3>
              <p className="text-[13px] text-natural-muted font-medium">{selected.desc}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-6 border-y border-natural-accent/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Season</p>
              <p className="text-[15px] font-bold text-natural-ink">{selected.season}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Watering</p>
              <p className="text-[15px] font-bold text-natural-ink">{selected.water}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Harvest Window</p>
              <p className="text-[15px] font-bold text-natural-ink">{selected.harvest}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-natural-muted mb-2">Soil Type</p>
              <p className="text-[15px] font-bold text-natural-ink">{selected.soil}</p>
            </div>
          </div>

          <div className="bg-natural-accent/10 p-6 rounded-[20px] border border-natural-accent/20">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-natural-muted mb-3 flex items-center gap-2">
              <Info size={14} /> Expert Cultivation Tips
            </h4>
            <p className="text-[14px] leading-relaxed font-medium">
              {selected.tips}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DetectorSection({ t, user, lang, onScanSaved }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert("Camera access denied or not available");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setImage(data);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64 = image.split(',')[1];
      const analysis = await analyzeCrop(base64, lang);
      setResult(analysis);
      
      if (user) {
        await saveScan({
          userId: user.uid,
          cropImage: image,
          analysisResult: analysis || '',
          cropType: 'Detected',
          diseaseDetected: 'Identified',
          confidence: 0.9
        });
        onScanSaved();
      }
    } catch (err) {
      setResult("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="natural-card">
        <div className="section-title">
          Crop Disease Detector <span className="text-natural-muted lowercase font-normal ml-2">● Live Analytics</span>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-[12px] h-[420px] relative flex items-center justify-center text-white border-[4px] border-natural-olive overflow-hidden">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : image ? (
            <img src={image} alt="crop" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center opacity-40 uppercase tracking-widest text-[11px] font-bold italic">
              [ Rear Camera Viewport Active ]
            </div>
          )}
          
          <div className="absolute w-full h-[1px] bg-natural-accent/30 top-1/2 shadow-[0_0_15px_#D9EDBF] animate-pulse"></div>
          
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="bg-black/60 px-4 py-2 rounded text-[12px] font-bold border border-natural-accent/40">
                Analyzing Leaf Structure...
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex flex-col gap-2">
            {!cameraActive ? (
              <button 
                onClick={startCamera} 
                className="natural-btn h-12 flex items-center justify-center gap-2"
              >
                <Camera size={18} /> {t.takePhoto}
              </button>
            ) : (
              <button onClick={capturePhoto} className="natural-btn h-12 flex items-center bg-orange-700 justify-center gap-2">
                Capture & Diagnose
              </button>
            )}
            
            {!cameraActive && (
              <label className="flex items-center justify-center h-24 border-2 border-dashed border-natural-olive rounded-[12px] bg-[#FAF9F6] cursor-pointer hover:bg-natural-accent/10 transition-all text-natural-muted">
                <div className="text-center">
                  <div className="text-xl mb-1">+</div>
                  <div className="text-[11px] font-bold uppercase tracking-wide">{t.uploadPhoto}</div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
            
            {image && !loading && !cameraActive && (
              <button onClick={processImage} className="natural-btn w-full bg-natural-ink mt-2">
                Run AI Diagnosis
              </button>
            )}
          </div>
          
          <div className="bg-natural-bg p-4 rounded-[12px] border border-natural-border text-[13px] leading-relaxed">
            <strong className="block text-[11px] uppercase tracking-widest mb-1 text-natural-muted">Real-time Insights</strong>
            FarmEasy AI detects Brown Rust, Leaf Spot, and powdery mildew with 98% accuracy. Ensure samples are free from mud and captured in indirect natural light for optimal results.
          </div>
        </div>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="natural-card bg-[#FAF9F6] border-2 border-natural-olive/30 shadow-none"
        >
          <div className="section-title text-natural-muted">AI Diagnostic Transcript</div>
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap text-natural-ink italic">
            {result}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function WeatherSection({ t, weather, city, setCity, fetchWeather, theme }: any) {
  const [localCity, setLocalCity] = useState(city);
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="natural-card bg-gradient-to-br from-[#91AC8F] to-[#66785F] text-white border-none shadow-lg">
        <div className="section-title text-white/80">Weather Report</div>
        {weather ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-4xl font-light">{weather.temp}°C</div>
                <div className="text-[14px] opacity-90">{weather.condition} - {city}</div>
              </div>
              <CloudSun size={48} className="opacity-40" />
            </div>
            <div className="pt-4 border-t border-white/10 text-[11px] opacity-90 flex gap-4 uppercase font-bold tracking-widest">
              <span>Humidity: {weather.humidity}%</span>
              <span>Wind: {weather.wind} km/h</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center opacity-70 italic">Loading local diagnostics...</div>
        )}
      </div>

      <div className="natural-card">
        <div className="section-title">Configure Location</div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={localCity} 
            onChange={(e) => setLocalCity(e.target.value)}
            placeholder={t.weatherSearchPlaceholder}
            className="natural-input mt-0"
          />
          <button 
            onClick={() => { setCity(localCity); fetchWeather(localCity); }}
            className="natural-btn mt-0"
          >
            {t.getWeather}
          </button>
        </div>
      </div>
    </div>
  );
}

function MarketSection({ t }: any) {
  const prices = t.prices || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="section-title text-center block mb-8">{t.marketPrice}</div>
      <div className="natural-card overflow-hidden !p-0">
        <table className="w-full border-collapse">
          <thead className="bg-natural-primary text-white">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest">Crop</th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-right">Price (₹/qt)</th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {prices.map((p, i) => (
              <tr key={i} className="hover:bg-natural-bg/30 transition-colors">
                <td className="px-6 py-4 text-[13px] font-bold">{p.crop}</td>
                <td className="px-6 py-4 text-[13px] font-mono text-right">₹{p.price}</td>
                <td className={`px-6 py-4 text-[13px] font-bold text-right ${p.change.startsWith('+') ? 'text-natural-muted' : 'text-rose-500'}`}>
                  {p.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileSection({ t, user, profile, hLogout, scans, onUpdateProfile }: any) {
  if (!user) return <div className="text-center py-20">{t.login}</div>;

  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [email, setEmail] = useState(profile?.email || '');

  const saveProfile = async () => {
    if (profile) {
      const updated = { ...profile, phoneNumber: phone, email: email };
      await saveUserProfile(updated);
      onUpdateProfile(updated);
      alert("Settings saved!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-4">
      <aside className="space-y-4">
        <div className="natural-card bg-gradient-to-br from-[#91AC8F] to-[#66785F] text-white border-none">
          <div className="section-title text-white/80">Weather Report Preview</div>
          <div className="text-3xl font-light">24°C</div>
          <div className="text-[13px] opacity-90 mt-1">Partly Cloudy - Punjab, PK</div>
        </div>

        <div className="natural-card">
          <div className="section-title">User Profile</div>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-natural-muted mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-inner">
              {profile?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="font-bold text-[15px]">{profile?.displayName}</div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-widest mt-0.5">Verified Lead Farmer</div>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-100 text-[13px]">
            <span>Total Scans</span>
            <span className="font-bold">{scans.length}</span>
          </div>
          <div className="flex justify-between py-2 text-[13px]">
            <span>Accuracy Rate</span>
            <span className="font-bold text-natural-muted">94%</span>
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="natural-card h-full">
          <div className="section-title">Analytics & Recent Scans</div>
          {scans.length > 0 ? (
            <div className="space-y-3 pt-2">
              {scans.slice(0, 5).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 font-sans last:border-0 hover:bg-natural-bg/30 px-2 rounded-lg transition-colors">
                  <div className="text-[13px]">
                    <div className="font-bold uppercase tracking-tight text-natural-muted">{s.analysisResult.split(' ')[0]} Detection</div>
                    <div className="text-[11px] text-zinc-400">{new Date(s.timestamp?.toDate()).toLocaleDateString()}</div>
                  </div>
                  <span className="text-natural-primary font-bold">✓</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-zinc-400 text-sm italic">
              No recent field data recorded.
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="natural-card">
          <div className="section-title">Notifications</div>
          <label className="text-[11px] text-natural-muted uppercase font-bold tracking-widest">Phone Number</label>
          <input type="text" className="natural-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXX XXX XXXX" />
          
          <label className="text-[11px] text-natural-muted uppercase font-bold tracking-widest mt-4 block">Email Address</label>
          <input type="email" className="natural-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="farmer@agro.com" />
          
          <button className="natural-btn w-full mt-4" onClick={saveProfile}>
            Enable Leaf Alerts
          </button>
        </div>

        <button 
          onClick={hLogout}
          className="w-full py-2.5 transition-colors border border-rose-200 text-rose-500 rounded-[12px] font-bold text-[12px] uppercase hover:bg-rose-50"
        >
          Disconnect Account
        </button>
      </aside>
    </div>
  );
}
