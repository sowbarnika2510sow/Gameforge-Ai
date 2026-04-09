import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Palette, 
  Ghost, 
  Monitor, 
  Zap, 
  Box, 
  Layers, 
  Map as MapIcon, 
  User, 
  Sun,
  Loader2,
  ChevronRight,
  Code,
  Download
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Textarea } from '@/src/components/ui/textarea';
import { generateGameAssets, generateAssetImage, type GameAsset, type GenerationInput } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [logs, setLogs] = useState<string[]>(['Initializing neural forge...', 'Ready for input parameters.']);
  const [input, setInput] = useState<GenerationInput>({
    gameType: 'RPG',
    artStyle: 'pixel art',
    theme: 'fantasy',
    platform: 'PC',
    difficulty: 'medium',
    customPrompt: ''
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message].slice(-10));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setAssets([]);
    addLog('Processing generative request...');
    try {
      const result = await generateGameAssets(input);
      setAssets(result);
      addLog(`${result.length} assets forged successfully.`);
      
      // Lazily generate images
      result.forEach(async (asset) => {
        if (asset.type === 'character' || asset.type === '2d' || asset.type === '3d') {
          addLog(`Generating visual for ${asset.name}...`);
          const imageUrl = await generateAssetImage(asset);
          if (imageUrl) {
            setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, imageUrl } : a));
            addLog(`Visual for ${asset.name} completed.`);
          } else {
            addLog(`Visual for ${asset.name} failed or skipped.`);
          }
        }
      });
    } catch (error) {
      console.error("Generation failed", error);
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (asset: GameAsset) => {
    let content: string | Blob;
    let fileName: string;
    let mimeType: string;

    if (asset.imageUrl && (asset.type === '2d' || asset.type === 'character' || asset.type === '3d')) {
      // Download image
      const link = document.createElement('a');
      link.href = asset.imageUrl;
      link.download = `${asset.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Download JSON data for others
    const data = {
      name: asset.name,
      type: asset.type,
      description: asset.description,
      visualStyle: asset.visualStyle,
      theme: asset.theme,
      proceduralData: asset.proceduralData
    };
    content = JSON.stringify(data, null, 2);
    fileName = `${asset.name.replace(/\s+/g, '_')}.json`;
    mimeType = 'application/json';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case '2d': return <Layers className="w-5 h-5" />;
      case '3d': return <Box className="w-5 h-5" />;
      case 'level': return <MapIcon className="w-5 h-5" />;
      case 'character': return <User className="w-5 h-5" />;
      case 'environment': return <Sun className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.3)]">
              <Zap className="text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase italic">GameForge <span className="text-orange-500">AI</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-mono">Procedural Asset Engine v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 font-mono text-[10px]">SYSTEM: ONLINE</Badge>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        {/* Sidebar Controls */}
        <aside className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Code className="w-4 h-4" /> Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Game Type</label>
                <Select value={input.gameType} onValueChange={(v) => setInput({...input, gameType: v})}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 focus:ring-orange-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="RPG">RPG</SelectItem>
                    <SelectItem value="FPS">FPS</SelectItem>
                    <SelectItem value="Platformer">Platformer</SelectItem>
                    <SelectItem value="Racing">Racing</SelectItem>
                    <SelectItem value="Puzzle">Puzzle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Art Style</label>
                <Select value={input.artStyle} onValueChange={(v) => setInput({...input, artStyle: v})}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="pixel art">Pixel Art</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="low-poly">Low-Poly</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Narrative Theme</label>
                <Select value={input.theme} onValueChange={(v) => setInput({...input, theme: v})}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                    <SelectItem value="medieval">Medieval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Platform</label>
                <Select value={input.platform} onValueChange={(v) => setInput({...input, platform: v})}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Console">Console</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Specific Details / Prompt</label>
                <Textarea 
                  placeholder="Describe specific character traits, weapon types, or level features..."
                  value={input.customPrompt}
                  onChange={(e) => setInput({...input, customPrompt: e.target.value})}
                  className="bg-zinc-950 border-zinc-800 focus:ring-orange-500/50 min-h-[100px] text-xs"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest h-12 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_rgb(154,52,18)] active:shadow-none active:translate-y-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forging...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                    Generate Assets
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="p-4 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
            <h3 className="text-[10px] uppercase font-bold text-zinc-600 mb-2">System Logs</h3>
            <div className="font-mono text-[9px] text-zinc-500 space-y-1">
              {logs.map((log, i) => (
                <p key={i} className={log.startsWith('ERROR') ? 'text-red-500' : log.includes('successfully') ? 'text-green-500' : ''}>
                  {`> ${log}`}
                </p>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="space-y-6">
          <AnimatePresence mode="wait">
            {assets.length === 0 && !loading ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-[600px] border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                  <Gamepad2 className="w-10 h-10 text-zinc-700" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-400 mb-2">No Assets Forged Yet</h2>
                <p className="text-zinc-600 max-w-md">Configure your game parameters on the left and hit generate to start creating your procedural assets.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-orange-500/50 transition-colors h-full flex flex-col">
                      <div className="h-2 w-full bg-zinc-800 group-hover:bg-orange-500 transition-colors" />
                      
                      {asset.imageUrl && (
                        <div className="aspect-square w-full overflow-hidden bg-zinc-950 border-b border-zinc-800 relative">
                          <img 
                            src={asset.imageUrl} 
                            alt={asset.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-zinc-950 rounded-md text-orange-500 border border-zinc-800">
                            {getIcon(asset.type)}
                          </div>
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 uppercase text-[9px] tracking-tighter">
                            {asset.type}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-bold group-hover:text-orange-500 transition-colors">{asset.name}</CardTitle>
                        <CardDescription className="text-xs text-zinc-500 italic">{asset.visualStyle} • {asset.theme}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-4">
                        <p className="text-sm text-zinc-400 leading-relaxed">{asset.description}</p>
                        
                        <div className="flex gap-2 mt-auto pt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 border-zinc-800 hover:bg-zinc-800 text-[10px] uppercase font-bold"
                            onClick={() => handleDownload(asset)}
                          >
                            <Download className="w-3 h-3 mr-2" />
                            Export {asset.imageUrl ? 'PNG' : 'JSON'}
                          </Button>
                        </div>

                        {asset.proceduralData && (
                          <div className="mt-4">
                            <Tabs defaultValue="preview" className="w-full">
                              <TabsList className="bg-zinc-950 border border-zinc-800 w-full h-8">
                                <TabsTrigger value="preview" className="text-[10px] uppercase flex-1">Preview</TabsTrigger>
                                <TabsTrigger value="raw" className="text-[10px] uppercase flex-1">Raw Data</TabsTrigger>
                              </TabsList>
                              <TabsContent value="preview" className="mt-2">
                                <div className="p-3 bg-zinc-950 rounded-md border border-zinc-800 min-h-[100px] flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-[10px] text-zinc-600 uppercase mb-1">Procedural Map</div>
                                    <div className="flex gap-1 justify-center">
                                      {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-2 h-2 bg-orange-500/20 rounded-sm" />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="raw" className="mt-2">
                                <ScrollArea className="h-[100px] w-full rounded-md border border-zinc-800 bg-zinc-950 p-2">
                                  <pre className="text-[10px] font-mono text-orange-500/80">
                                    {JSON.stringify(asset.proceduralData, null, 2)}
                                  </pre>
                                </ScrollArea>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 py-8 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <Zap className="w-4 h-4" />
            <span>Powered by Google Gemini AI</span>
          </div>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold text-zinc-600">
            <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-orange-500 transition-colors">API Reference</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Community</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
