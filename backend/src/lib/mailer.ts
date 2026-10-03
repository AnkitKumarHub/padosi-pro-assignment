import nodemailer from "nodemailer";

/** The only place a plaintext OTP leaves the service. */
export type Mailer = { sendOtpCode: (to: string, code: string) => Promise<void> };

export function createMailer(options: {
  host: string;
  port: number;
  from: string;
}): Mailer {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: false,
  });

  return {
    async sendOtpCode(to, code) {
      await transport.sendMail({
        from: options.from,
        to,
        subject: "Your PadosiPro verification code",
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
      });
    },
  };
}
