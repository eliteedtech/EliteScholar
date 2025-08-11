import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import SuperAdminLayout from "@/components/superadmin/layout";

const sendInvoiceSchema = z.object({
  communicationMethod: z.enum(["email", "sms", "whatsapp"]),
  recipient: z.string().min(1, "Recipient is required"),
  subject: z.string().optional(),
  message: z.string().optional(),
});

type SendInvoiceFormData = z.infer<typeof sendInvoiceSchema>;

interface InvoiceSendPageProps {
  invoiceId: string;
  schoolName: string;
  invoiceNumber: string;
  totalAmount: string;
  onClose: () => void;
}

export default function InvoiceSendPage({ 
  invoiceId, 
  schoolName, 
  invoiceNumber, 
  totalAmount, 
  onClose 
}: InvoiceSendPageProps) {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: () => api.get(`/api/invoices/${invoiceId}`),
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/superadmin/settings"],
    queryFn: () => api.get("/api/superadmin/settings"),
  });

  const form = useForm<SendInvoiceFormData>({
    resolver: zodResolver(sendInvoiceSchema),
    defaultValues: {
      communicationMethod: "email",
      subject: `Invoice ${invoiceNumber} from Elite Scholar`,
      message: `Dear ${schoolName},\n\nPlease find attached your invoice ${invoiceNumber} for the amount of ${totalAmount}.\n\nThank you for choosing Elite Scholar.`,
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (data: SendInvoiceFormData) =>
      api.post(`/api/invoices/${invoiceId}/send`, data),
    onSuccess: () => {
      toast({
        title: "Invoice Sent",
        description: `Invoice ${invoiceNumber} has been sent successfully via ${form.getValues("communicationMethod")}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.response?.data?.message || "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SendInvoiceFormData) => {
    sendInvoiceMutation.mutate(data);
  };

  const generateInvoicePreview = () => {
    if (!invoice || !settings?.invoiceTemplate) return "";
    
    return settings.invoiceTemplate
      .replace(/\{\{schoolName\}\}/g, schoolName)
      .replace(/\{\{invoiceNumber\}\}/g, invoiceNumber)
      .replace(/\{\{totalAmount\}\}/g, totalAmount)
      .replace(/\{\{dueDate\}\}/g, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "")
      .replace(/\{\{items\}\}/g, invoice.lines?.map((line: any) => 
        `<tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${line.description}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">${line.quantity}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">₦${(parseFloat(line.total) / 100).toLocaleString()}</td>
        </tr>`
      ).join("") || "");
  };

  const watchedMethod = form.watch("communicationMethod");

  return (
    <SuperAdminLayout title="Send Invoice" subtitle={`Send ${invoiceNumber} to ${schoolName}`}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Send Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Invoice</CardTitle>
              <CardDescription>
                Choose how to deliver the invoice to the school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Communication Method */}
                <div>
                  <Label htmlFor="communicationMethod">Communication Method</Label>
                  <Select
                    value={form.watch("communicationMethod")}
                    onValueChange={(value) => form.setValue("communicationMethod", value as any)}
                  >
                    <SelectTrigger data-testid="select-communication-method">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-envelope text-blue-500"></i>
                          Email
                          <Badge variant={settings?.smtpHost ? "secondary" : "destructive"} className="ml-auto">
                            {settings?.smtpHost ? "Ready" : "Not Set"}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-sms text-green-500"></i>
                          SMS
                          <Badge variant={settings?.twilioAccountSid ? "secondary" : "destructive"} className="ml-auto">
                            {settings?.twilioAccountSid ? "Ready" : "Not Set"}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <i className="fab fa-whatsapp text-green-600"></i>
                          WhatsApp
                          <Badge variant={settings?.twilioWhatsappNumber ? "secondary" : "destructive"} className="ml-auto">
                            {settings?.twilioWhatsappNumber ? "Ready" : "Not Set"}
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipient */}
                <div>
                  <Label htmlFor="recipient">
                    {watchedMethod === "email" ? "Email Address" : "Phone Number"}
                  </Label>
                  <Input
                    id="recipient"
                    {...form.register("recipient")}
                    placeholder={
                      watchedMethod === "email" 
                        ? "school@example.com" 
                        : watchedMethod === "whatsapp"
                        ? "+1234567890"
                        : "+1234567890"
                    }
                    data-testid="input-recipient"
                  />
                  {form.formState.errors.recipient && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.recipient.message}
                    </p>
                  )}
                </div>

                {/* Subject (Email only) */}
                {watchedMethod === "email" && (
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      data-testid="input-subject"
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <Label htmlFor="message">
                    {watchedMethod === "email" ? "Email Message" : "Text Message"}
                  </Label>
                  <Textarea
                    id="message"
                    {...form.register("message")}
                    rows={6}
                    placeholder={
                      watchedMethod === "email"
                        ? "Email content with invoice attachment..."
                        : "SMS/WhatsApp message with invoice link..."
                    }
                    data-testid="textarea-message"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="outline"
                        data-testid="button-preview"
                      >
                        Preview Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Invoice Preview</DialogTitle>
                        <DialogDescription>
                          Preview of {invoiceNumber} before sending
                        </DialogDescription>
                      </DialogHeader>
                      <div 
                        className="border rounded-lg p-6 bg-white"
                        dangerouslySetInnerHTML={{ __html: generateInvoicePreview() }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="submit"
                    disabled={sendInvoiceMutation.isPending}
                    data-testid="button-send-invoice"
                  >
                    {sendInvoiceMutation.isPending ? "Sending..." : `Send via ${watchedMethod}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Summary of the invoice to be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Invoice Number</Label>
                  <p className="font-mono">{invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">School</Label>
                  <p>{schoolName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Total Amount</Label>
                  <p className="font-semibold text-lg">{totalAmount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <Badge variant="outline">{invoice?.status || "SENT"}</Badge>
                </div>
              </div>

              {invoice?.lines && invoice.lines.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Items</Label>
                  <div className="space-y-2 mt-2">
                    {invoice.lines.map((line: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm">{line.description}</span>
                        <span className="text-sm font-medium">
                          ₦{(parseFloat(line.total) / 100).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invoice?.dueDate && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Due Date</Label>
                  <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {invoice?.notes && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Notes</Label>
                  <p className="text-sm text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </SuperAdminLayout>
  );
}