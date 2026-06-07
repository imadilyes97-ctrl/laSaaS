"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Database, Package, Bot, Loader2 } from "lucide-react"

type CheckResult = {
  table: string
  exists: boolean | null
  error?: string
}

export default function SetupPage() {
  const [results, setResults] = useState<CheckResult[]>([])
  const [checking, setChecking] = useState(false)

  const tables = [
    "profiles",
    "commandes",
    "conversations",
    "produits",
    "config_chatbot",
  ]

  const checkTables = async () => {
    setChecking(true)
    const supabase = createClient()
    const newResults: CheckResult[] = []

    for (const table of tables) {
      const { error } = await supabase.from(table).select("id", { count: "exact", head: true })
      newResults.push({
        table,
        exists: !error || error.code === "PGRST116",
        error: error ? (error.code === "PGRST116" ? undefined : error.message) : undefined,
      })
    }

    setResults(newResults)
    setChecking(false)
  }

  const allExist = results.length > 0 && results.every((r) => r.exists)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configuration Supabase</CardTitle>
          <CardDescription>
            Vérifiez que toutes les tables et le bucket de stockage sont créés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button onClick={checkTables} disabled={checking} size="lg">
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier l'installation"
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.table}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {r.exists ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{r.table}</p>
                      {r.error && (
                        <p className="text-xs text-muted-foreground">{r.error}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${r.exists ? "text-green-600" : "text-destructive"}`}>
                    {r.exists ? "OK" : "Manquant"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {allExist && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-200">
                Tout est configuré ! Les pages Produits et Chatbot devraient fonctionner.
              </p>
            </div>
          )}

          {results.length > 0 && !allExist && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Tables manquantes — action requise
                </p>
                <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                  <li>Va sur <strong>https://supabase.com/dashboard</strong></li>
                  <li>Ouvre ton projet</li>
                  <li>Clique sur <strong>SQL Editor</strong></li>
                  <li>Colle le contenu du fichier <code className="bg-background px-1 rounded">scripts/setup.sql</code></li>
                  <li>Clique sur <strong>Run</strong></li>
                </ol>
              </div>

              <details className="border rounded-lg">
                <summary className="p-3 cursor-pointer font-medium text-sm hover:bg-muted/50">
                  Voir le SQL à exécuter
                </summary>
                <div className="p-3 border-t">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-96">
{`-- Exécute ceci dans le SQL Editor Supabase
-- Va dans ton projet > SQL Editor > colle > Run

CREATE TABLE IF NOT EXISTS profiles (...);
CREATE TABLE IF NOT EXISTS commandes (...);
CREATE TABLE IF NOT EXISTS conversations (...);
CREATE TABLE IF NOT EXISTS produits (...);
CREATE TABLE IF NOT EXISTS config_chatbot (...);

-- Pour le SQL complet, ouvre le fichier scripts/setup.sql
-- ou copie-le depuis l'éditeur Supabase`}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
