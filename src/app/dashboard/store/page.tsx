
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { searchSkidrow } from '@/lib/skidrow-scraper';
import type { SkidrowSearchResult } from '@/lib/skidrow-scraper';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useHints } from '@/context/HintContext';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";

const StoreResultCard = ({ result }: { result: SkidrowSearchResult }) => {
    return (
        <Link 
          href={`/dashboard/store/details?url=${encodeURIComponent(result.url)}&title=${encodeURIComponent(result.title)}&posterUrl=${encodeURIComponent(result.posterUrl || '')}`}
          className="block group w-full h-full rounded-lg focus:outline-none text-left aspect-[3/4] transition-transform duration-300 ease-in-out hover:scale-105 focus-within:scale-105"
        >
            <Card className="bg-black/20 backdrop-blur-lg border-2 border-transparent group-focus-within:border-primary transition-all duration-300 ease-in-out h-full w-full overflow-hidden relative">
                {result.posterUrl ? (
                    <Image src={result.posterUrl} alt={result.title} fill className="object-cover"/>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <h3 className="text-xl font-bold text-foreground">{result.title}</h3>
                    </div>
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-lg font-bold text-white text-glow truncate">{result.title}</h3>
                </div>
            </Card>
        </Link>
    );
};

export default function StorePage() {
    const { currentUser } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SkidrowSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [pageTitle, setPageTitle] = useState("App Store");

    const { setHints } = useHints();
    const gridRef = useRef<HTMLDivElement>(null);

    useBackNavigation('/dashboard/applications');
    useGridNavigation({ gridRef });

    useEffect(() => {
        if (!hasSearched) {
            try {
                const historyString = localStorage.getItem('macro-store-history');
                if (historyString) {
                    const history = JSON.parse(historyString);
                    if (history.length > 0) {
                        setResults(history);
                        setPageTitle("Recently Viewed");
                    }
                }
            } catch (e) {
                console.error("Failed to load store history", e);
            }
        }
    }, [hasSearched]);

    useEffect(() => {
        setHints([
            { key: '↕↔', action: 'Navigate' },
            { key: 'A', action: 'Select' },
            { key: 'Y', action: 'Search' },
            { key: 'B', action: 'Back' },
        ]);
        if (!isLoading && (hasSearched || results.length > 0)) {
             gridRef.current?.querySelector('a, button')?.focus();
        }
        return () => setHints([]);
    }, [setHints, isLoading, hasSearched, results]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'y' && !isKeyboardOpen) {
                e.preventDefault();
                setIsKeyboardOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isKeyboardOpen]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery || !currentUser) return;
        setIsLoading(true);
        setResults([]);
        setHasSearched(true);
        setPageTitle(`Results for "${searchQuery}"`);
        const searchResults = await searchSkidrow(searchQuery, currentUser);
        setResults(searchResults);
        setIsLoading(false);
    }, [searchQuery, currentUser]);

    useEffect(() => {
        if (!isLoading && hasSearched) {
            // Give the DOM a moment to update before trying to focus
            setTimeout(() => {
                gridRef.current?.querySelector('a')?.focus();
            }, 100);
        }
    }, [isLoading, hasSearched]);

    const handleKeyboardClose = () => {
        setIsKeyboardOpen(false);
        handleSearch();
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-bold tracking-tight text-glow flex items-center gap-4">
                    {pageTitle === 'Recently Viewed' && <History className="h-8 w-8 text-muted-foreground" />}
                    {pageTitle}
                </h2>
                <div className="relative w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    placeholder="Search for new apps & games..."
                    className="pl-10 focus-visible:ring-primary focus-visible:ring-2"
                    value={searchQuery}
                    onFocus={() => setIsKeyboardOpen(true)}
                    onClick={() => setIsKeyboardOpen(true)}
                    readOnly
                    />
                </div>
            </div>
            
            <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {isLoading 
                    ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)
                    : results.map((result, i) => <StoreResultCard key={`${result.url}-${i}`} result={result} />)
                }
            </div>
            
            {!isLoading && hasSearched && results.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">No results found for "{searchQuery}".</p>
                    <p className="text-sm text-muted-foreground/50">Try checking your spelling or using a different search term.</p>
                </div>
            )}
            {!isLoading && !hasSearched && results.length === 0 && (
                 <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">Use the search bar to find new apps and games.</p>
                </div>
            )}

            <Dialog open={isKeyboardOpen} onOpenChange={(isOpen) => !isOpen && handleKeyboardClose()}>
                <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-4xl flex justify-center" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="sr-only">
                    <DialogTitle>On-Screen Keyboard</DialogTitle>
                    <DialogDescription>Search for a new app or game.</DialogDescription>
                    </DialogHeader>
                    <OnScreenKeyboard
                        onInput={(char) => setSearchQuery(q => q + char)}
                        onDelete={() => setSearchQuery(q => q.slice(0, -1))}
                        onEnter={handleKeyboardClose}
                        onClose={() => setIsKeyboardOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
