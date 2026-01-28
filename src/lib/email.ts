import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();

// Configura a chave de API (se existir)
if (process.env.BREVO_API_KEY) {
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

interface SendEmailParams {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams) {
    if (!process.env.BREVO_API_KEY) {
        console.warn('⚠️ BREVO_API_KEY não encontrada. E-mail simulado:', { to, subject });
        return { success: true, simulated: true };
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: "ControlAI", email: "noreply@controlai.com" };
    sendSmtpEmail.to = to;

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ E-mail enviado com sucesso via Brevo:', data.body);
        return { success: true, data: data.body };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('❌ Erro ao enviar e-mail via Brevo:', error);
        return { success: false, error: errorMessage };
    }
}

export async function sendWelcomeEmail(email: string, name: string) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #2563eb;">Bem-vindo ao ControlAI! 🚀</h1>
            </div>
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Estamos muito felizes em ter você conosco. Sua conta foi criada com sucesso e você já pode começar a explorar o poder da Inteligência Artificial Corporativa com segurança total.</p>
            <p>O que você pode fazer agora:</p>
            <ul>
                <li>Configurar os modelos de IA da sua empresa.</li>
                <li>Convidar sua equipe para colaborar.</li>
                <li>Criar agentes personalizados.</li>
            </ul>
            <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Painel</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #666; text-align: center;">
                Se você não criou esta conta, ignore este e-mail.
            </p>
        </div>
    `;

    return sendEmail({
        to: [{ email, name }],
        subject: "Bem-vindo ao ControlAI - Sua IA Corporativa Segura",
        htmlContent,
    });
}

export async function sendInviteEmail(email: string, companyName: string, inviteLink: string) {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #2563eb;">Convite para Colaborar</h1>
            </div>
            <p>Você foi convidado para participar da empresa <strong>${companyName}</strong> no ControlAI.</p>
            <p>Junte-se à equipe para acessar ferramentas de IA seguras e colaborativas.</p>
            <div style="text-align: center; margin-top: 32px;">
                <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Aceitar Convite</a>
            </div>
            <p style="margin-top: 24px; font-size: 14px; text-align: center;">
                Ou copie este link: <a href="${inviteLink}">${inviteLink}</a>
            </p>
        </div>
    `;

    return sendEmail({
        to: [{ email }],
        subject: `Convite para participar da ${companyName} no ControlAI`,
        htmlContent,
    });
}
