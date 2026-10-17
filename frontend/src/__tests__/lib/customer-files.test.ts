import { describe, expect, it } from "vitest";
import { detectCustomerFileType, formatCustomerFileMetaValue } from "@/lib/customer-files";

const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("detectCustomerFileType", () => {
  it("accepts PNG, JPEG, WebP and PDF by content", () => {
    expect(detectCustomerFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(detectCustomerFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectCustomerFileType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(detectCustomerFileType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d))).toBe("application/pdf");
  });

  it("rejects SVG, HTML, scripts and other content regardless of the filename", () => {
    const encode = (text: string) => new TextEncoder().encode(text);
    expect(detectCustomerFileType(encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(detectCustomerFileType(encode("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectCustomerFileType(encode("<?php echo 1;"))).toBeNull();
    expect(detectCustomerFileType(new Uint8Array())).toBeNull();
  });
});

describe("formatCustomerFileMetaValue", () => {
  it("writes the marker understood by the WordPress customer-files plugin", () => {
    expect(formatCustomerFileMetaValue({ token: "a".repeat(32), filename: "logo.png" })).toBe(`logo.png [kubikart-file:${"a".repeat(32)}]`);
  });
});
