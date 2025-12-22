import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Upload, Loader2, Wand2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AiModelGenerator({ onModelGenerated, onClose }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // 'uploading', 'generating', 'success', 'error'
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

    const MESHY_API_KEY = import.meta.env.VITE_MESHY_API_KEY;

    if (!MESHY_API_KEY) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-200">
                <h3 className="font-bold flex items-center gap-2"><AlertCircle /> Missing API Key</h3>
                <p className="text-sm mt-1">Please add VITE_MESHY_API_KEY to your .env file.</p>
            </div>
        )
    }

    const handleGenerate = async () => {
        if (!file) return;
        setLoading(true);
        setStatus('Uploading Image...');
        setErrorMsg('');

        try {
            // 1. Upload Image to Supabase to get Public URL
            const fileExt = file.name.split('.').pop();
            const fileName = `ai_input_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('pavilions')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl: imageUrl } } = supabase.storage
                .from('pavilions')
                .getPublicUrl(fileName);

            // 2. Call Meshy API
            setStatus('Initializing AI Generation...');
            console.log('Sending to Meshy:', imageUrl);

            const response = await fetch('https://api.meshy.ai/v1/image-to-3d', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${MESHY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_url: imageUrl,
                    enable_pbr: true,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to start generation');
            }

            const { result: taskId } = await response.json();

            // 3. Poll for Completion
            await pollTask(taskId);

        } catch (err) {
            console.error(err);
            setErrorMsg(err.message);
            setLoading(false);
            setStatus('error');
        }
    };

    const pollTask = async (taskId) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`https://api.meshy.ai/v1/image-to-3d/${taskId}`, {
                    headers: { 'Authorization': `Bearer ${MESHY_API_KEY}` }
                });
                const data = await res.json();

                if (data.status === 'SUCCEEDED') {
                    clearInterval(interval);
                    setStatus('success');
                    setLoading(false);
                    onModelGenerated(data.model_urls.glb);
                } else if (data.status === 'FAILED') {
                    clearInterval(interval);
                    throw new Error('Generation Failed: ' + data.task_error?.message);
                } else {
                    setStatus(`Generating... ${data.progress}%`);
                    setProgress(data.progress);
                }
            } catch (err) {
                clearInterval(interval);
                setErrorMsg(err.message);
                setLoading(false);
            }
        }, 2000); // Check every 2 seconds
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f1623] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

                <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-purple-300">
                    <Wand2 className="w-5 h-5" /> AI Model Generator
                </h2>
                <p className="text-xs text-slate-400 mb-6">Turn any image into a 3D model (GLB).</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                            <span className="absolute text-[10px] font-bold">{progress}%</span>
                        </div>
                        <p className="text-sm text-purple-200 animate-pulse">{status}</p>
                    </div>
                ) : status === 'success' ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white">Generation Complete!</h3>
                        <p className="text-slate-400 text-sm mb-4">Your model is ready to be added.</p>
                        <button onClick={onClose} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-bold">Done</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="text-center">
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="h-32 object-contain mb-2 rounded border border-white/20" />
                                    <p className="text-xs text-slate-300">{file.name}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-400">Click to upload image</p>
                                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">PNG, JPG</p>
                                </>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-300">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={!file}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-bold text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Wand2 size={16} /> Generate 3D Model
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
