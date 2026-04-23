import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-center mb-4 text-teal-600">隐私政策</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">1. 引言</h2>
          <p className="mb-2 text-gray-700">程序员宝盒（以下简称"我们"或"本站"）非常重视用户的隐私和个人信息保护。本隐私政策旨在向您说明我们如何收集、使用、存储和共享您的个人信息，以及您享有的相关权利。</p>
          <p className="mb-2 text-gray-700">请您在使用我们的服务前，仔细阅读并了解本隐私政策的全部内容。如您对本政策有任何疑问，可通过本政策末尾提供的联系方式与我们联系。</p>
          <p className="mb-2 text-gray-700">当您使用或继续使用我们的服务时，即表示您同意我们按照本隐私政策收集、使用、存储和共享您的相关信息。</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">2. 我们收集的信息</h2>
          <p className="mb-2 text-gray-700">为了向您提供服务，我们可能会收集以下类型的信息：</p>
          
          <h3 className="text-lg font-medium mb-2 text-teal-700">2.1 您主动提供的信息</h3>
          <p className="mb-2 text-gray-700">当您注册账号、使用我们的服务或与我们联系时，您可能会提供以下信息：</p>
          <ul className="list-disc pl-8 mb-3 text-gray-700">
            <li>账号信息：用户名、密码、电子邮箱地址等；</li>
            <li>个人身份信息：通过微信公众号授权登录时获取的头像、昵称等；</li>
            <li>联系信息：您提供的联系方式，如电子邮箱等；</li>
            <li>您通过我们的客服或参与调查问卷时向我们提供的其他信息；</li>
            <li>通过公众号、企业微信等渠道发送给平台的信息：包括但不限于文本、链接、视频、音频、图片等各类媒体内容，这些信息将被存储用于服务提供和功能实现。</li>
          </ul>
          
          <h3 className="text-lg font-medium mb-2 text-teal-700">2.2 我们自动收集的信息</h3>
          <p className="mb-2 text-gray-700">当您使用我们的服务时，我们可能会自动收集以下信息：</p>
          <ul className="list-disc pl-8 mb-3 text-gray-700">
            <li>设备信息：如设备型号、操作系统版本、唯一设备标识符、IP地址等；</li>
            <li>日志信息：如您的搜索查询内容、访问日期和时间、浏览历史以及您与我们服务交互的信息；</li>
            <li>位置信息：如您的IP地址、GPS信息（如果您授权我们访问位置信息）；</li>
            <li>Cookie和类似技术收集的信息。</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">3. 我们如何使用您的信息</h2>
          <p className="mb-2 text-gray-700">我们可能将收集的信息用于以下目的：</p>
          <ul className="list-disc pl-8 mb-2 text-gray-700">
            <li>提供、维护和改进我们的服务；</li>
            <li>创建和管理您的账号；</li>
            <li>验证您的身份，防止欺诈和提高安全性；</li>
            <li>处理您的请求和反馈；</li>
            <li>向您发送服务通知和更新；</li>
            <li>进行数据分析，以改善用户体验；</li>
            <li>基于您的IP地址归属地信息，为您提供当地天气信息展示服务；</li>
            <li>利用第三方接口或AI技术，对您发送的网站链接进行智能分析，包括但不限于站点标题、类型、标签等信息的提取和分类；</li>
            <li>遵守法律法规的要求；</li>
            <li>其他征得您同意的用途。</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">4. Cookie和类似技术</h2>
          <p className="mb-2 text-gray-700">我们使用Cookie和类似技术来收集和存储您的信息，以便为您提供更加个性化的服务体验。</p>
          <p className="mb-2 text-gray-700">您可以通过浏览器设置拒绝或管理Cookie。但请注意，如果您禁用Cookie，可能无法使用我们服务的某些功能。</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">5. 信息共享与披露</h2>
          <p className="mb-2 text-gray-700">除以下情况外，未经您同意，我们不会与任何第三方共享您的个人信息：</p>
          <ul className="list-disc pl-8 mb-2 text-gray-700">
            <li>在法律法规要求或允许的范围内，如应政府机关或司法机构的要求；</li>
            <li>为保护我们及其用户的权利、财产或安全；</li>
            <li>在获得您明确同意的情况下；</li>
            <li>与我们的关联公司共享，他们将遵守本隐私政策；</li>
            <li>与提供服务的供应商、合作伙伴共享，这些主体需遵守保密义务；</li>
            <li>为提供智能分析服务，我们可能会将您发送的网站链接信息传输给第三方AI服务提供商或接口服务商，用于分析站点标题、类型、标签等信息，这些第三方服务商将严格遵守数据保护义务。</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">6. 信息存储与安全</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">6.1 信息存储：我们会在法律法规要求的期限内，在中华人民共和国境内存储您的个人信息。</p>
            <p className="mb-2 text-gray-700">6.2 数据处理技术：我们可能会使用IP地址解析技术获取您的地理位置信息，用于提供天气服务；同时，我们可能会使用第三方AI接口或API服务，对您提供的网站链接进行智能分析，提取站点标题、类型、标签等信息，以改善服务质量和用户体验。</p>
            <p className="mb-2 text-gray-700">6.3 信息安全：我们采取各种安全技术和程序，以防信息的丢失、不当使用、未经授权阅览或披露。例如，在某些服务中，我们将利用加密技术（如SSL）来保护您提供的个人信息。但请您理解，由于技术的限制以及可能存在的各种恶意手段，即便我们竭尽全力加强安全措施，也不可能始终保证信息百分之百的安全。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">7. 您的权利</h2>
          <p className="mb-2 text-gray-700">根据适用的法律法规，您可能享有以下权利：</p>
          <ul className="list-disc pl-8 mb-2 text-gray-700">
            <li>访问权：您有权访问我们持有的关于您的个人信息；</li>
            <li>更正权：您有权要求更正不准确的个人信息；</li>
            <li>删除权：在特定情况下，您有权要求删除您的个人信息；</li>
            <li>限制处理权：在特定情况下，您有权限制我们对您个人信息的处理；</li>
            <li>反对权：在特定情况下，您有权反对我们处理您的个人信息；</li>
            <li>数据可携带权：在技术可行的情况下，您有权以结构化、常用和机器可读的格式接收您的个人信息，并有权将这些信息传输给另一个控制者。</li>
          </ul>
          <p className="text-gray-700">如您想行使上述权利，请通过本政策末尾提供的联系方式与我们联系。</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">8. 未成年人保护</h2>
          <p className="mb-2 text-gray-700">我们非常重视对未成年人个人信息的保护。如您是未满18周岁的未成年人，在使用我们的服务前，应确保事先取得监护人的同意。</p>
          <p className="text-gray-700">如我们发现自己在未事先获得可证实的父母或监护人同意的情况下收集了未成年人的个人信息，则会设法尽快删除相关数据。</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">9. 隐私政策的更新</h2>
          <p className="mb-2 text-gray-700">我们可能会不时更新本隐私政策。当我们对隐私政策作出重大变更时，我们会在网站上发布通知，并在变更生效前通过您提供的联系方式通知您。</p>
          <p className="text-gray-700">我们鼓励您定期查阅本隐私政策，以了解我们如何保护您的信息。</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 text-teal-700">10. 联系我们</h2>
          <p className="mb-2 text-gray-700">如您对本隐私政策有任何疑问、意见或建议，或者您希望行使您的权利，请通过以下方式与我们联系：397729842@qq.com 我们将在收到您的请求后30天内回复。</p>
        </section>

        <p className="text-gray-600 mb-4">最后更新日期：2025年09月01日</p>
      </div>
      
      <div className="text-center">
        <Link href="/" className="text-teal-600 hover:text-teal-800 mr-4">
          返回首页
        </Link>
        <Link href="/agreement" className="text-teal-600 hover:text-teal-800">
          查看用户协议
        </Link>
      </div>
    </div>
  );
}