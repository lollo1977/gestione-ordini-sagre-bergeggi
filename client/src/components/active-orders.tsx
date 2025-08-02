import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Printer, Receipt, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OrderWithItems, DishCategory } from "@shared/schema";
import { DISH_CATEGORIES } from "@shared/schema";

export default function ActiveOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeOrders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders/active"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ordine completato",
        description: "L'ordine è stato completato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Errore nel completamento dell'ordine",
        variant: "destructive",
      });
    },
  });

  const printKitchenReceipt = (order: OrderWithItems) => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scontrino Cucina</title>
          <style>
            @media print {
              @page { margin: 2mm; size: 58mm auto; }
              body { margin: 0; padding: 0; padding-bottom: 60mm; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              line-height: 1.3;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 2mm;
              width: 54mm;
              max-width: 54mm;
              padding-bottom: 60mm;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-weight: bold;
              font-size: 18px;
            }
            .footer {
              border-top: 1px dashed #000;
              padding-top: 6px;
              text-align: center;
              margin-top: 8px;
              font-size: 10px;
              padding-bottom: 15mm;
            }
            .category {
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
              border-top: 1px dashed #666;
              padding: 4px 0 3px 0;
              margin: 8px 0 5px 0;
              font-size: 16px;
              background: #f0f0f0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-weight: bold; font-size: 16px;">CUCINA</div>
            <div style="font-size: 16px; margin-top: 3px; font-weight: bold;">CRCS BERGEGGI</div>
            <div style="margin-top: 6px;">
              <div style="font-weight: bold; font-size: 15px;">Tavolo <span style="font-size: 20px;">${order.tableNumber}</span> - <span style="font-size: 20px;">${order.customerName}</span></div>
              <div style="font-size: 14px; font-weight: bold;">Coperti: <span style="font-size: 18px;">${order.covers}</span></div>
              <div style="font-size: 12px; font-weight: bold;">
                ${new Date(order.createdAt).toLocaleDateString('it-IT')} ${new Date(order.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          
          <div>
            ${Object.entries(DISH_CATEGORIES).map(([categoryKey, categoryLabel]) => {
              const categoryItems = order.items.filter(item => item.dish.category === categoryKey);
              if (categoryItems.length === 0) return '';
              
              return `
                <div class="category">${categoryLabel}</div>
                ${categoryItems.map(item => `
                  <div class="item">
                    <span style="font-size: 18px;">${item.dish.name}</span>
                    <span style="font-size: 28px; font-weight: 900; color: #000;">${item.quantity.toString()}</span>
                  </div>
                `).join('')}
              `;
            }).filter(section => section).join('')}
          </div>
          
          <div class="footer">
            <div style="text-align: center; font-size: 14px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
              Buon lavoro!
            </div>
            <div style="height: 60mm; line-height: 4mm;">
              <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=220,height=400');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  const printCustomerReceipt = (order: OrderWithItems) => {
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scontrino Cliente</title>
          <style>
            @media print {
              @page { margin: 2mm; size: 58mm auto; }
              body { margin: 0; padding: 0; padding-bottom: 60mm; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              line-height: 1.2;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 2mm;
              width: 54mm;
              max-width: 54mm;
              overflow: hidden;
              padding-bottom: 60mm;
            }
            .header {
              text-align: center;
              margin-bottom: 6px;
              border-bottom: 1px solid #000;
              padding-bottom: 6px;
            }
            .item {
              margin-bottom: 4px;
              font-size: 18px;
              width: 100%;
              overflow: visible;
              line-height: 1.4;
            }
            .total {
              border-top: 1px solid #000;
              padding-top: 6px;
              margin-top: 6px;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #000;
              padding-top: 6px;
              margin-top: 6px;
              font-size: 10px;
              padding-bottom: 15mm;
            }
            .category {
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1px solid #000;
              border-top: 1px dashed #666;
              padding: 4px 0 3px 0;
              margin: 6px 0 4px 0;
              font-size: 14px;
              color: #000;
              background: #f0f0f0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 14px; font-weight: bold;">CRCS BERGEGGI</div>
            <div style="font-size: 10px; margin-top: 2px; font-weight: bold;">Circolo Ricreativo Culturale Sportivo</div>
          </div>
          
          <div style="margin-bottom: 6px; font-size: 11px; font-weight: bold;">
            <div style="font-size: 13px;">TAVOLO: <span style="font-size: 16px; font-weight: bold;">${order.tableNumber}</span></div>
            <div style="font-size: 13px;">CLIENTE: <span style="font-size: 16px; font-weight: bold;">${order.customerName}</span></div>
            <div style="font-size: 12px;">Coperti: <span style="font-size: 15px; font-weight: bold;">${order.covers}</span></div>
            <div style="font-size: 10px;">
              ${new Date(order.createdAt).toLocaleDateString('it-IT')} - ${new Date(order.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div style="border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 6px;">
            ${Object.entries(DISH_CATEGORIES).map(([categoryKey, categoryLabel]) => {
              const categoryItems = order.items.filter(item => item.dish.category === categoryKey);
              if (categoryItems.length === 0) return '';
              
              return `
                <div class="category">${categoryLabel}</div>
                ${categoryItems.map(item => `
                  <div class="item">
                    <div style="font-size: 13px; font-weight: bold;">
                      ${item.quantity} ${item.dish.name} ........... €${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                `).join('')}
              `;
            }).filter(section => section).join('')}
          </div>
          
          <div class="total">
            <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 4px; padding: 3px; border: 1px solid #000;">
              TOTALE: €${parseFloat(order.total).toFixed(2)}
            </div>
            <div style="text-align: center; font-size: 12px; font-weight: bold; margin-top: 4px;">
              PAGAMENTO: <span style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">${order.paymentMethod === 'cash' ? 'CONTANTI' : 'POS'}</span>
            </div>
          </div>
          
          <div class="footer">
            <div style="text-align: center; font-size: 12px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px;">
              Grazie per la vostra visita!
            </div>
            <div style="height: 60mm; line-height: 4mm;">
              <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=220,height=400');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border">
        <CardContent className="p-6">
          <div className="text-center">Caricamento ordini...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="text-accent mr-3" />
          Ordini Attivi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activeOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nessun ordine attivo
            </div>
          ) : (
            activeOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                      Tavolo {order.tableNumber}
                    </span>
                    <p className="text-gray-600 mt-1">{order.customerName}</p>
                    <p className="text-gray-500 text-sm">Coperti: {order.covers}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-secondary">
                      €{parseFloat(order.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {order.items.map(item => `${item.quantity}x ${item.dish.name}`).join(', ')}
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-secondary hover:bg-green-700 text-white"
                    onClick={() => printKitchenReceipt(order)}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Cucina
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-blue-700 text-white"
                    onClick={() => printCustomerReceipt(order)}
                  >
                    <Receipt className="w-4 h-4 mr-1" />
                    Cliente
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => completeOrderMutation.mutate(order.id)}
                    disabled={completeOrderMutation.isPending}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
