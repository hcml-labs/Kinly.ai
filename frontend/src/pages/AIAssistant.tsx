import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, Image, Mic, FileText, CheckCircle } from 'lucide-react';
import { aiApi, AIParseResponse, ParsedAppointment } from '@/api/ai';
import { appointmentsApi } from '@/api/appointments';
import { toast } from '@/hooks/use-toast';
import { getCategoryBgClass } from '@/lib/utils';

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'email' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<AIParseResponse | null>(null);

  const familyId = localStorage.getItem('familyId');

  const handleTextParse = async () => {
    if (!familyId || !textInput.trim()) return;
    setIsProcessing(true);
    try {
      const result = await aiApi.parseText(familyId, textInput);
      setParseResult(result);
      toast({ title: 'Text parsed successfully!' });
    } catch (error) {
      toast({ title: 'Error parsing text', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailParse = async () => {
    if (!familyId || !emailBody.trim()) return;
    setIsProcessing(true);
    try {
      const result = await aiApi.parseEmail(familyId, emailSubject, emailBody);
      setParseResult(result);
      toast({ title: 'Email parsed successfully!' });
    } catch (error) {
      toast({ title: 'Error parsing email', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!familyId || !e.target.files?.[0]) return;
    setIsProcessing(true);
    try {
      const result = await aiApi.parseImage(familyId, e.target.files[0]);
      setParseResult(result);
      toast({ title: 'Image parsed successfully!' });
    } catch (error) {
      toast({ title: 'Error parsing image', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const createAppointment = async (parsed: ParsedAppointment) => {
    if (!familyId || !parsed.title || !parsed.start_time || !parsed.end_time) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }
    try {
      await appointmentsApi.create({
        family_id: familyId,
        title: parsed.title,
        description: parsed.description,
        category: (parsed.category as any) || 'personal',
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        location: parsed.location,
        recurrence_rule: parsed.recurrence_rule,
      });
      toast({ title: 'Appointment created!' });
    } catch (error) {
      toast({ title: 'Error creating appointment', variant: 'destructive' });
    }
  };

  if (!familyId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please create a family first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">AI Assistant</h1>
      </div>

      <p className="text-gray-600">
        Let AI help you create appointments from text, emails, or images. Just paste or upload, and we'll extract the details.
      </p>

      {/* Input Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'text' ? 'default' : 'outline'}
          onClick={() => setActiveTab('text')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Text / Voice
        </Button>
        <Button
          variant={activeTab === 'email' ? 'default' : 'outline'}
          onClick={() => setActiveTab('email')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button
          variant={activeTab === 'image' ? 'default' : 'outline'}
          onClick={() => setActiveTab('image')}
        >
          <Image className="h-4 w-4 mr-2" />
          Image / Flyer
        </Button>
      </div>

      {/* Text Input */}
      {activeTab === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle>Natural Language Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type or speak your appointment</Label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Add soccer practice every Tuesday at 5 PM at the community center for Emma"
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>
            <Button onClick={handleTextParse} disabled={isProcessing || !textInput.trim()}>
              {isProcessing ? 'Processing...' : 'Parse Text'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Email Input */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle>Parse School/Clinic Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Reminder: Parent-Teacher Conference"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Paste the email content here..."
                className="w-full min-h-[200px] px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>
            <Button onClick={handleEmailParse} disabled={isProcessing || !emailBody.trim()}>
              {isProcessing ? 'Processing...' : 'Parse Email'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Image Upload */}
      {activeTab === 'image' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Flyer or Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50">
                <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Click to upload an image</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG, PDF</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isProcessing}
              />
            </label>
            {isProcessing && (
              <p className="text-center mt-4 text-gray-500">Processing image...</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parse Results */}
      {parseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Parsed Results
              <span className="text-sm font-normal text-gray-500">
                (Confidence: {Math.round(parseResult.overall_confidence * 100)}%)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parseResult.parsed_appointments.length === 0 ? (
              <p className="text-gray-500">No appointments detected. Try providing more details.</p>
            ) : (
              parseResult.parsed_appointments.map((apt, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{apt.title || 'Untitled'}</h4>
                      {apt.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBgClass(apt.category)}`}>
                          {apt.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(apt.confidence_score * 100)}% confident
                    </span>
                  </div>
                  {apt.description && <p className="text-sm text-gray-600">{apt.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {apt.start_time && <div><strong>Start:</strong> {apt.start_time}</div>}
                    {apt.end_time && <div><strong>End:</strong> {apt.end_time}</div>}
                    {apt.location && <div><strong>Location:</strong> {apt.location}</div>}
                    {apt.child_name && <div><strong>Child:</strong> {apt.child_name}</div>}
                    {apt.recurrence_rule && <div className="col-span-2"><strong>Recurrence:</strong> {apt.recurrence_rule}</div>}
                  </div>
                  <Button size="sm" onClick={() => createAppointment(apt)}>
                    Create Appointment
                  </Button>
                </div>
              ))
            )}

            {parseResult.suggestions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-2">Suggestions</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  {parseResult.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;
