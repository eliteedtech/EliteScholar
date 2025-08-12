import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Mail, MessageSquare, Phone, Send, Eye, Download } from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/layout";

interface InvoiceViewPageProps {
  invoiceId: string;
  onClose: () => void;
}

interface EnhancedInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  dueDate: string;
  notes?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: string;
    unitMeasurement: string;
    negotiatedPrice?: string;
    total: string;
    startDate?: string;
    endDate?: string;
  }>;
  school: {
    id: string;
    name: string;
    email: string;
    phones: string[];
    address: string;
    state: string;
    lga: string;
  };
}

interface CommunicationSettings {
  email: { available: boolean; address: string };
  whatsapp: { available: boolean; phones: string[] };
  sms: { available: boolean; phones: string[] };
}

export default function EnhancedInvoiceView({ invoiceId, onClose }: InvoiceViewPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [communicationMethod, setCommunicationMethod] = useState<"email" | "whatsapp" | "both">("email");
  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Fetch invoice details
  const { data: invoice, isLoading: invoiceLoading } = useQuery<EnhancedInvoice>({
    queryKey: ["/api/invoices/enhanced", invoiceId],
    queryFn: () => apiRequest("GET", `/api/invoices/enhanced/${invoiceId}`).then(res => res.json()),
  });

  // Fetch communication settings
  const { data: commSettings } = useQuery<CommunicationSettings>({
    queryKey: ["/api/invoices/enhanced/school", invoice?.school.id, "communication-settings"],
    queryFn: () => apiRequest("GET", `/api/invoices/enhanced/school/${invoice?.school.id}/communication-settings`).then(res => res.json()),
    enabled: !!invoice?.school.id,
  });

  // Send invoice mutation
  const sendInvoiceMutation = useMutation({
    mutationFn: async (data: {
      communicationMethod: string;
      subject?: string;
      message: string;
      recipients: { email?: string; phone?: string };
    }) => {
      const response = await apiRequest("POST", `/api/invoices/enhanced/${invoiceId}/send`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invoice Sent",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/enhanced", invoiceId] });
      setSendDialogOpen(false);
      resetSendForm();
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetSendForm = () => {
    setCustomEmail("");
    setCustomPhone("");
    setSubject("");
    setMessage("");
    setCommunicationMethod("email");
  };

  const handleSendInvoice = () => {
    if (!invoice) return;

    const recipients: { email?: string; phone?: string } = {};
    
    if (communicationMethod === "email" || communicationMethod === "both") {
      recipients.email = customEmail || invoice.school.email;
    }
    
    if (communicationMethod === "whatsapp" || communicationMethod === "both") {
      recipients.phone = customPhone || (invoice.school.phones && invoice.school.phones[0]);
    }

    sendInvoiceMutation.mutate({
      communicationMethod,
      subject: subject || `Invoice ${invoice.invoiceNumber} from Elite Scholar`,
      message: message || `Dear ${invoice.school.name},\n\nPlease find your invoice ${invoice.invoiceNumber} for the amount of ₦${(parseFloat(invoice.totalAmount) / 100).toFixed(2)}.\n\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for choosing Elite Scholar.`,
      recipients,
    });
  };

  const openSendDialog = () => {
    if (!invoice) return;
    
    setSubject(`Invoice ${invoice.invoiceNumber} from Elite Scholar`);
    setMessage(`Dear ${invoice.school.name},\n\nPlease find your invoice ${invoice.invoiceNumber} for the amount of ₦${(parseFloat(invoice.totalAmount) / 100).toFixed(2)}.\n\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for choosing Elite Scholar.`);
    setSendDialogOpen(true);
  };

  if (invoiceLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading invoice...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!invoice) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Invoice not found</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6" data-testid="enhanced-invoice-view">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Details</h1>
            <p className="text-muted-foreground">View and manage invoice {invoice.invoiceNumber}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={openSendDialog}
              data-testid="button-send-invoice"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
            <Button variant="outline" data-testid="button-download-pdf">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card data-testid="card-invoice-info">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Invoice Information
                  <Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>
                    {invoice.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                    <p className="text-lg font-semibold" data-testid="text-invoice-number">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                    <p className="text-lg font-semibold text-green-600" data-testid="text-total-amount">
                      ₦{(parseFloat(invoice.totalAmount) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <p className="text-lg" data-testid="text-due-date">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.emailSent ? "default" : "secondary"}>
                        {invoice.emailSent ? "Email Sent" : "Email Not Sent"}
                      </Badge>
                      {invoice.emailSentAt && (
                        <span className="text-sm text-muted-foreground">
                          on {new Date(invoice.emailSentAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {invoice.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm" data-testid="text-notes">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Lines */}
            <Card data-testid="card-invoice-lines">
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.lines && invoice.lines.length > 0 ? (
                    invoice.lines.map((line, index) => (
                      <div key={line.id} className="border rounded-lg p-4" data-testid={`invoice-line-${index}`}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="font-medium">{line.description}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Quantity & Unit</Label>
                            <p>{line.quantity} {line.unitMeasurement}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Unit Price</Label>
                            <p>₦{(parseFloat(line.unitPrice) / 100).toFixed(2)}</p>
                            {line.negotiatedPrice && (
                              <p className="text-xs text-green-600">
                                Negotiated: ₦{(parseFloat(line.negotiatedPrice) / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Total</Label>
                            <p className="font-semibold">₦{(parseFloat(line.total) / 100).toFixed(2)}</p>
                          </div>
                          {(line.startDate || line.endDate) && (
                            <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t">
                              <Label className="text-xs text-muted-foreground">Service Period</Label>
                              <p className="text-xs">
                                {line.startDate && new Date(line.startDate).toLocaleDateString()} - {line.endDate && new Date(line.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No line items available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* School Information */}
          <div className="space-y-6">
            <Card data-testid="card-school-info">
              <CardHeader>
                <CardTitle>School Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">School Name</Label>
                  <p className="font-semibold" data-testid="text-school-name">{invoice.school.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm" data-testid="text-school-email">{invoice.school.email || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone Numbers</Label>
                  <div className="space-y-1">
                    {invoice.school.phones && invoice.school.phones.length > 0 ? (
                      invoice.school.phones.map((phone, index) => (
                        <p key={index} className="text-sm" data-testid={`text-phone-${index}`}>{phone}</p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm" data-testid="text-school-address">
                    {invoice.school.address || "Not provided"}
                    {invoice.school.lga && `, ${invoice.school.lga}`}
                    {invoice.school.state && `, ${invoice.school.state}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Communication Status */}
            {commSettings && (
              <Card data-testid="card-communication-status">
                <CardHeader>
                  <CardTitle>Communication Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email:</span>
                      <Badge variant={commSettings.email.available ? "default" : "secondary"}>
                        {commSettings.email.available ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">WhatsApp:</span>
                      <Badge variant={commSettings.whatsapp.available ? "default" : "secondary"}>
                        {commSettings.whatsapp.available ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">SMS:</span>
                      <Badge variant={commSettings.sms.available ? "default" : "secondary"}>
                        {commSettings.sms.available ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Send Invoice Dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-send-invoice">
            <DialogHeader>
              <DialogTitle>Send Invoice {invoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Communication Method */}
              <div>
                <Label className="text-sm font-medium">Communication Method</Label>
                <RadioGroup 
                  value={communicationMethod} 
                  onValueChange={(value: "email" | "whatsapp" | "both") => setCommunicationMethod(value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" data-testid="radio-email" />
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" data-testid="radio-whatsapp" />
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" data-testid="radio-both" />
                    <Label htmlFor="both" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 mr-1" />
                      <MessageSquare className="h-4 w-4" />
                      Both Email & WhatsApp
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Recipients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(communicationMethod === "email" || communicationMethod === "both") && (
                  <div>
                    <Label htmlFor="customEmail">Email Address</Label>
                    <Input
                      id="customEmail"
                      type="email"
                      placeholder={invoice.school.email || "Enter email address"}
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      data-testid="input-custom-email"
                    />
                  </div>
                )}
                {(communicationMethod === "whatsapp" || communicationMethod === "both") && (
                  <div>
                    <Label htmlFor="customPhone">Phone Number</Label>
                    <Input
                      id="customPhone"
                      type="tel"
                      placeholder={invoice.school.phones?.[0] || "Enter phone number"}
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      data-testid="input-custom-phone"
                    />
                  </div>
                )}
              </div>

              {/* Subject (for email) */}
              {(communicationMethod === "email" || communicationMethod === "both") && (
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    data-testid="input-subject"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  data-testid="textarea-message"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSendDialogOpen(false)} data-testid="button-cancel-send">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendInvoice}
                  disabled={sendInvoiceMutation.isPending}
                  data-testid="button-confirm-send"
                >
                  {sendInvoiceMutation.isPending ? "Sending..." : "Send Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}