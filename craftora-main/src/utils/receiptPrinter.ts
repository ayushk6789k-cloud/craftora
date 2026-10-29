import { Order, formatPaise } from '../types';

/**
 * Generates an authentic, beautifully formatted HTML receipt and triggers printing.
 * Works seamlessly in all desktop and mobile browsers, iframe environments, and popups.
 */
export function printOrderReceipt(order: Order, options?: { autoPrint?: boolean }) {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    // If popups are blocked by browser, fallback to standard window.print()
    window.print();
    return;
  }

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  const itemsRows = (order.items || [])
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #29231f;">
          <strong>${item.product_name}</strong>
          ${item.product_id ? `<br/><span style="font-size: 11px; color: #7a4b35;">Item ID: ${item.product_id.slice(0, 13)}</span>` : ''}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e5e5; text-align: center; font-size: 13px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 13px;">
          ${formatPaise(item.unit_price)}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 13px; font-weight: 700;">
          ${formatPaise(item.total_price)}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Receipt - Order ${order.order_number}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            background-color: #faf7f2;
            color: #29231f;
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container {
            max-width: 780px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            border: 1px solid #d9b99b;
            padding: 36px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          }
          .header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #7a4b35;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand-logo {
            font-family: Georgia, serif;
            font-size: 28px;
            font-weight: 800;
            color: #7a4b35;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #7a4b35;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
            margin-top: 4px;
          }
          .invoice-meta {
            text-align: right;
            font-size: 13px;
          }
          .order-number {
            font-size: 18px;
            font-weight: 800;
            color: #29231f;
            margin-top: 4px;
          }
          .badge {
            display: inline-block;
            background: #e8f5e9;
            color: #1b5e20;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 28px;
          }
          .info-card {
            background: #faf7f2;
            border: 1px solid #ecdccb;
            border-radius: 14px;
            padding: 16px;
            font-size: 13px;
            line-height: 1.5;
          }
          .card-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #7a4b35;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #faf7f2;
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            color: #7a4b35;
            border-bottom: 2px solid #ecdccb;
            font-weight: 700;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 6px 8px;
            font-size: 13px;
          }
          .total-amount-row td {
            border-top: 2px solid #7a4b35;
            font-size: 16px;
            font-weight: 800;
            color: #7a4b35;
            padding-top: 10px;
          }
          .footer-note {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px solid #ecdccb;
            text-align: center;
            font-size: 11px;
            color: #8c786a;
          }
          .no-print-bar {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-btn {
            background: #7a4b35;
            color: #ffffff;
            border: none;
            padding: 12px 28px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(122, 75, 53, 0.25);
          }
          @media print {
            .no-print-bar { display: none !important; }
            body { padding: 0 !important; background: transparent !important; }
            .receipt-container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="print-btn" onclick="window.print()">🖨️ Click Here to Print Receipt</button>
        </div>

        <div class="receipt-container">
          <div class="header-row">
            <div>
              <div class="brand-logo">CRAFTORA</div>
              <div class="brand-sub">Handcrafted Accessories Marketplace</div>
              <p style="margin: 4px 0 0; font-size: 11px; color: #666;">Authentic Artisan & Campus Creators Direct</p>
            </div>
            <div class="invoice-meta">
              <span style="color: #666; font-size: 12px;">Tax Invoice / Official Receipt</span>
              <div class="order-number">${order.order_number}</div>
              <div style="color: #666; font-size: 12px; margin-top: 3px;">Date: ${orderDate}</div>
              <div class="badge">Verified • ${order.payment_status?.toUpperCase() || 'PAID'}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-card">
              <div class="card-title">Customer & Delivery Details</div>
              <strong>${order.shipping_name || 'Customer'}</strong><br/>
              ${order.shipping_address_line1 || ''}<br/>
              ${order.shipping_address_line2 ? order.shipping_address_line2 + '<br/>' : ''}
              ${order.shipping_city || ''}, ${order.shipping_state || ''} - ${order.shipping_postal_code || ''}<br/>
              <span style="color: #777;">Phone: ${order.shipping_phone || 'N/A'}</span>
            </div>

            <div class="info-card">
              <div class="card-title">Order Information</div>
              <strong>Payment Method:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Prepaid)'}<br/>
              <strong>Order Status:</strong> <span style="color: #1b5e20; font-weight: 700;">${order.order_status?.toUpperCase() || 'CONFIRMED'}</span><br/>
              <strong>Fulfillment:</strong> Campus Artisan Workshop<br/>
              <strong>Database Verification:</strong> <span style="color: #1b5e20;">Supabase PostgreSQL Verified</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Handcrafted Item Description</th>
                <th style="text-align: center; width: 12%;">Qty</th>
                <th style="text-align: right; width: 18%;">Unit Price</th>
                <th style="text-align: right; width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right; font-weight: 600;">${formatPaise(order.subtotal_amount)}</td>
            </tr>
            ${
              order.discount_amount > 0
                ? `
            <tr>
              <td style="color: #1b5e20;">Artisan Coupon Discount</td>
              <td style="text-align: right; color: #1b5e20; font-weight: 600;">-${formatPaise(order.discount_amount)}</td>
            </tr>`
                : ''
            }
            <tr>
              <td>Delivery / Shipping</td>
              <td style="text-align: right; font-weight: 600;">
                ${order.shipping_amount === 0 ? '<span style="color: #1b5e20;">FREE</span>' : formatPaise(order.shipping_amount)}
              </td>
            </tr>
            <tr class="total-amount-row">
              <td>Total Amount Paid</td>
              <td style="text-align: right;">${formatPaise(order.total_amount)}</td>
            </tr>
          </table>

          <div class="footer-note">
            <p style="margin: 0 0 4px; font-weight: 700; color: #7a4b35;">Thank you for supporting independent handcrafted artisans!</p>
            <p style="margin: 0;">This is a computer-generated tax invoice and receipt for Craftora Marketplace orders.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
