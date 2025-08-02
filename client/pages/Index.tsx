import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key, Play, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { 
  ApifyActor, 
  ApifyInputSchema, 
  ApifyRun, 
  ApifyDatasetItem,
  ListActorsResponse,
  GetActorSchemaResponse,
  ExecuteActorResponse,
  ValidateApiKeyResponse
} from "@shared/api";

type AppState = 'auth' | 'actors' | 'execution';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('auth');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [actors, setActors] = useState<ApifyActor[]>([]);
  const [selectedActor, setSelectedActor] = useState<ApifyActor | null>(null);
  const [actorSchema, setActorSchema] = useState<ApifyInputSchema | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    run: ApifyRun;
    results?: ApifyDatasetItem[];
  } | null>(null);
  const { toast } = useToast();

  const validateApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Apify API key",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/apify/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data: ValidateApiKeyResponse = await response.json();

      if (data.valid) {
        toast({
          title: "API Key Valid",
          description: "Successfully authenticated with Apify",
        });
        await loadActors();
        setAppState('actors');
      } else {
        toast({
          title: "Invalid API Key",
          description: data.error || "Please check your API key and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Unable to validate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, toast]);

  const loadActors = useCallback(async () => {
    try {
      const response = await fetch('/api/apify/actors', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const data: ListActorsResponse = await response.json();

      if (data.error) {
        toast({
          title: "Failed to Load Actors",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setActors(data.actors);

      if (data.actors.length === 0) {
        toast({
          title: "No Actors Found",
          description: "You don't have any actors in your Apify account",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Actors Loaded",
          description: `Found ${data.actors.length} actor${data.actors.length === 1 ? '' : 's'} in your account`,
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Unable to load actors. Please try again.",
        variant: "destructive",
      });
    }
  }, [apiKey, toast]);

  const selectActor = useCallback(async (actor: ApifyActor) => {
    setSelectedActor(actor);
    setActorSchema(null);
    setInputValues({});
    setExecutionResult(null);
    setAppState('execution');

    console.log(`Loading schema for actor: ${actor.id} - ${actor.title}`);

    try {
      const response = await fetch(`/api/apify/actors/${actor.id}/schema`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`Schema response status: ${response.status}`);
      console.log(`Schema response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Schema fetch failed:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: GetActorSchemaResponse = await response.json();
      console.log(`Schema response data:`, JSON.stringify(data, null, 2));

      if (data.error) {
        console.error(`Schema error:`, data.error);
        toast({
          title: "Schema Load Failed",
          description: data.error,
          variant: "destructive",
        });
        // Set an empty schema object to show the "no schema" UI
        setActorSchema({} as ApifyInputSchema);
        return;
      }

      console.log(`Setting schema:`, data.schema);
      setActorSchema(data.schema);

      if (data.schema && data.schema.properties && Object.keys(data.schema.properties).length > 0) {
        toast({
          title: "Schema Loaded",
          description: `Found ${Object.keys(data.schema.properties).length} input parameters`,
        });
      } else if (data.schema) {
        toast({
          title: "Schema Loaded",
          description: "Actor has an empty input schema",
        });
      } else {
        toast({
          title: "No Schema Available",
          description: "This actor doesn't have an input schema defined",
        });
      }
    } catch (error) {
      console.error(`Schema load error:`, error);
      toast({
        title: "Schema Load Failed",
        description: `Unable to load actor schema: ${error.message}`,
        variant: "destructive",
      });
      setActorSchema(null);
    }
  }, [apiKey, toast]);

  const executeActor = useCallback(async () => {
    if (!selectedActor) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch(`/api/apify/actors/${selectedActor.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: inputValues }),
      });

      const data: ExecuteActorResponse = await response.json();

      if (data.error) {
        toast({
          title: "Execution Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setExecutionResult({
        run: data.run,
        results: data.results,
      });

      const statusVariant = data.run.status === 'SUCCEEDED' ? 'default' : 'destructive';

      toast({
        title: "Execution Complete",
        description: `Actor run ${data.run.status.toLowerCase()}`,
        variant: statusVariant,
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Unable to execute actor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }, [selectedActor, apiKey, inputValues, toast]);

  const handleInputChange = (key: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderInputField = (key: string, property: any) => {
    const isRequired = actorSchema?.required?.includes(key);
    const isReadOnly = property.readOnly || key.startsWith('_');

    // Handle read-only/info fields
    if (isReadOnly) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            {property.title || key}
          </Label>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-accent-foreground">
              {property.description}
            </p>
          </div>
        </div>
      );
    }

    if (property.type === 'boolean') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center gap-2">
            {property.title || key}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={key}
              checked={inputValues[key] || false}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-muted-foreground">
              {inputValues[key] ? 'True' : 'False'}
            </span>
          </div>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
        </div>
      );
    }

    if (property.type === 'array') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center gap-2">
            {property.title || key}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id={key}
            placeholder={property.description || `Enter ${property.title || key} (one per line or JSON array)`}
            value={Array.isArray(inputValues[key]) ? inputValues[key].join('\n') : (inputValues[key] || '')}
            onChange={(e) => {
              const value = e.target.value;
              // Try to parse as array (split by lines)
              const arrayValue = value.split('\n').filter(line => line.trim());
              handleInputChange(key, arrayValue.length > 0 ? arrayValue : value);
            }}
            className="min-h-[100px]"
          />
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
        </div>
      );
    }

    if (property.type === 'object') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center gap-2">
            {property.title || key}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id={key}
            placeholder={property.description || `Enter ${property.title || key} as JSON`}
            value={typeof inputValues[key] === 'object' ? JSON.stringify(inputValues[key], null, 2) : (inputValues[key] || '')}
            onChange={(e) => {
              const value = e.target.value;
              try {
                // Try to parse as JSON
                const jsonValue = JSON.parse(value);
                handleInputChange(key, jsonValue);
              } catch {
                // If not valid JSON, store as string
                handleInputChange(key, value);
              }
            }}
            className="min-h-[120px] font-mono text-sm"
          />
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
        </div>
      );
    }

    // For string type, check if it should be a textarea
    const shouldUseTextarea = property.format === 'textarea' ||
                             (property.description && property.description.length > 100) ||
                             (property.title && property.title.toLowerCase().includes('url')) ||
                             key.toLowerCase().includes('url') ||
                             key.toLowerCase().includes('content') ||
                             key.toLowerCase().includes('text') ||
                             key.toLowerCase().includes('input');

    if (property.type === 'string' && shouldUseTextarea) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="flex items-center gap-2">
            {property.title || key}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            id={key}
            placeholder={property.description || property.example || `Enter ${property.title || key}`}
            value={inputValues[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="min-h-[100px]"
          />
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          {property.example && (
            <p className="text-xs text-muted-foreground">Example: {property.example}</p>
          )}
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {property.title || key}
          {isRequired && <span className="text-destructive">*</span>}
        </Label>
        <Input
          id={key}
          type={property.type === 'number' || property.type === 'integer' ? 'number' : 'text'}
          placeholder={property.example || `Enter ${property.title || key}`}
          value={inputValues[key] !== undefined ? inputValues[key] : (property.default || '')}
          min={property.minimum}
          max={property.maximum}
          onChange={(e) => {
            const value = (property.type === 'number' || property.type === 'integer') ?
              (e.target.value ? Number(e.target.value) : '') :
              e.target.value;
            handleInputChange(key, value);
          }}
        />
        {property.description && (
          <p className="text-xs text-muted-foreground">{property.description}</p>
        )}
        {property.example && property.example !== (property.default || '') && (
          <p className="text-xs text-muted-foreground">Example: {property.example}</p>
        )}
        {(property.minimum !== undefined || property.maximum !== undefined) && (
          <p className="text-xs text-muted-foreground">
            Range: {property.minimum || 'no limit'} - {property.maximum || 'no limit'}
          </p>
        )}
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-success/10 text-success border-success/20';
      case 'FAILED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'RUNNING':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  if (appState === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Apify Integration</h1>
              <p className="text-muted-foreground mt-2">
                Connect your Apify account to manage and execute actors
              </p>
            </div>
          </div>

          {/* API Key Form */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Authenticate</CardTitle>
              <CardDescription>
                Enter your Apify API key to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="apify_api_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validateApiKey()}
                />
                <p className="text-xs text-muted-foreground">
                  Find your API key in{' '}
                  <a
                    href="https://console.apify.com/account/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Apify Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              <Button
                onClick={validateApiKey}
                disabled={isValidating || !apiKey.trim()}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Connect to Apify'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (appState === 'actors') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Actors</h1>
              <p className="text-muted-foreground mt-1">
                Select an actor to configure and execute
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setAppState('auth');
                setApiKey('');
                setActors([]);
                setSelectedActor(null);
              }}
            >
              Change API Key
            </Button>
          </div>

          {/* Actors Grid */}
          {actors.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Actors Found</h3>
                  <p>You don't have any actors in your Apify account yet.</p>
                  <a
                    href="https://console.apify.com/actors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                  >
                    Create an Actor
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actors.map((actor) => (
                <Card
                  key={actor.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50"
                  onClick={() => selectActor(actor)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight truncate">
                          {actor.title || actor.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>@{actor.username}</span>
                          {actor.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {actor.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {actor.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{actor.stats.totalRuns.toLocaleString()} runs</span>
                      <span>
                        Updated {new Date(actor.modifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appState === 'execution' && selectedActor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button
                variant="ghost"
                onClick={() => setAppState('actors')}
                className="mb-2 -ml-4"
              >
                ← Back to Actors
              </Button>
              <h1 className="text-3xl font-bold text-foreground">
                {selectedActor.title || selectedActor.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure inputs and execute this actor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Input Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the input parameters for this actor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {actorSchema === null ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Loading schema...</p>
                    </div>
                  ) : actorSchema && actorSchema.properties && Object.keys(actorSchema.properties).length > 0 ? (
                    <>
                      <div className="text-sm text-muted-foreground mb-4">
                        Configure the input parameters for <strong>{selectedActor.title || selectedActor.name}</strong>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(actorSchema.properties).map(([key, property]) =>
                          renderInputField(key, property)
                        )}
                      </div>
                    </>
                  ) : actorSchema && (!actorSchema.properties || Object.keys(actorSchema.properties).length === 0) ? (
                    <div className="space-y-4">
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <h3 className="font-medium text-foreground mb-1">Empty Schema</h3>
                        <p className="text-sm">This actor has an empty input schema.</p>
                        <p className="text-sm">You can try executing it without inputs.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <h3 className="font-medium text-foreground mb-1">No Input Schema Available</h3>
                        <p className="text-sm">This actor doesn't have a defined input schema.</p>
                        <p className="text-sm">You can try executing it without inputs or check the actor documentation.</p>
                        <a
                          href={`https://console.apify.com/actors/${selectedActor.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-3 text-primary hover:underline text-sm"
                        >
                          View in Apify Console
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={executeActor}
                    disabled={isExecuting}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Execute Actor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {executionResult && (
                <>
                  {/* Run Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(executionResult.run.status)}
                        Execution Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(executionResult.run.status)}>
                          {executionResult.run.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Run ID: {executionResult.run.id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Started:</span>
                          <p className="font-mono">
                            {new Date(executionResult.run.startedAt).toLocaleString()}
                          </p>
                        </div>
                        {executionResult.run.finishedAt && (
                          <div>
                            <span className="text-muted-foreground">Finished:</span>
                            <p className="font-mono">
                              {new Date(executionResult.run.finishedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {executionResult.run.stats.runTimeSecs && (
                          <div>
                            <span className="text-muted-foreground">Runtime:</span>
                            <p className="font-mono">
                              {executionResult.run.stats.runTimeSecs}s
                            </p>
                          </div>
                        )}
                        {executionResult.run.stats.outputBytes && (
                          <div>
                            <span className="text-muted-foreground">Output:</span>
                            <p className="font-mono">
                              {(executionResult.run.stats.outputBytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Results Data */}
                  {executionResult.results && executionResult.results.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Results ({executionResult.results.length} items)</CardTitle>
                        <CardDescription>
                          Data extracted by the actor
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">
                          <pre className="text-xs whitespace-pre-wrap break-all">
                            {JSON.stringify(executionResult.results, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
