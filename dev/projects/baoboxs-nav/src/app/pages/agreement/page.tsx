import React from 'react';
import Link from 'next/link';

export default function UserAgreement() {
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <h1 className="text-2xl font-bold text-center mb-2 text-teal-600">用户协议</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">1. 协议的接受与适用范围</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">欢迎使用程序员宝盒（以下简称"本站"）提供的导航服务！本用户协议与法律声明（以下简称"本协议"）是为了明确本站与您双方的权利义务，让您更好地了解和使用本站的服务。</p>
            <p className="mb-2 text-gray-700">当您访问、使用、注册或以其他方式使用本站服务时，本站理解您已经阅读并同意接受本协议的约束。如果您对任何条款有疑问或不同意，本站建议您暂停使用本站服务，并欢迎您通过客服渠道与本站沟通。</p>
            <p className="mb-2 text-gray-700">为了提供更好的服务体验，本站可能会根据运营需要或法律法规要求对本协议进行优化调整，调整后的协议将在本站公布。如果您继续使用本站的服务，本站理解您已经接受更新后的协议内容。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">2. 服务性质与角色定位（索引/导航）</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">2.1 本站是一个提供"网址索引/导航工具"的信息服务平台，主要帮助您便捷地发现和访问各种有用的网站。本站本身不创建或控制第三方网站的内容，也不代表本站对这些网站的内容进行推荐或担保。</p>
            <p className="mb-2 text-gray-700">2.2 当本站收录或展示某个链接时，这仅表示在收录时本站没有发现明显的问题，但这不能保证该网站内容会一直保持合规、可靠或安全。</p>
            <p className="mb-2 text-gray-700">2.3 请您理解，第三方网站的内容质量、可用性、稳定性以及可能对您产生的影响，都需要由这些网站自己负责。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">3. 内容监控与我们的努力</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">3.1 互联网上的信息变化很快，第三方网站的内容也可能随时更新。由于技术和成本的限制，本站无法对每个链接的目标内容进行实时、全面的监控和审查。</p>
            <p className="mb-2 text-gray-700">3.2 尽管如此，本站会在收录链接时进行合理的检查，并建立了"收到反馈—核实情况—及时处理"的工作流程来降低风险。但本站无法对第三方内容的准确性、合法性、安全性或持续可用性做出保证。</p>
            <p className="mb-2 text-gray-700">3.3 请您理解，当您访问第三方网站时，您是与该网站直接建立关系；如果因为第三方内容或服务产生任何问题、损失或风险，通常需要由该第三方负责处理。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">4. 问题反馈与处理机制</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">4.1 如果您发现本站收录的链接存在违法、违规或侵犯您合法权益的情况，本站非常欢迎您通过以下方式联系本站，本站会认真对待每一个反馈：</p>
            <ul className="list-disc pl-8 mb-2 text-gray-700">
              <li>反馈邮箱：<a href="mailto:397729842@qq.com" className="text-teal-600 hover:text-teal-800">397729842@qq.com</a></li>
            </ul>
            <p className="mb-2 text-gray-700">4.2 为了让本站能够更高效地处理您的反馈，建议您在联系时提供以下信息：您的身份证明、问题链接的具体地址、相关权利证明（如适用）、问题描述、您的联系方式，以及您对反馈内容真实性的承诺。</p>
            <p className="mb-2 text-gray-700">4.3 收到您的有效反馈后，本站会根据相关法律法规尽快核实情况并采取适当措施（如取消展示、断开链接、临时屏蔽等），并及时与您沟通处理结果。</p>
            <p className="mb-2 text-gray-700">4.4 对于一些复杂的权属争议情况，本站可能需要更多时间进行核实，也可能需要您提供补充材料，或者建议通过法律途径解决。</p>
            <p className="mb-2 text-gray-700">4.5 本站的处理时间承诺：收到有效反馈后，本站会在2个工作日内完成初步审核并可能采取临时措施；一般会在7个工作日内完成进一步核实并给出处理结果；对于复杂情况，处理时间可能会相应延长。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">5. 用户使用须知与责任</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">5.1 在使用本站的服务时，请您自行判断和评估访问第三方网站的风险，包括内容的安全性、真实性、隐私保护、交易安全等方面。本站希望您能够谨慎使用，保护好自己的权益。</p>
            <p className="mb-2 text-gray-700">5.2 请您在使用本站的服务时遵守相关法律法规，不要进行任何可能损害网络安全、侵犯他人权益或影响公共秩序的行为。</p>
            <p className="mb-2 text-gray-700">5.3 如果因为您的行为导致任何第三方提出索赔、争议或造成损失，您需要自行承担相应的法律责任。</p>
            <p className="mb-2 text-gray-700">5.4 如果您发现本站展示的链接存在风险或不当内容，本站非常欢迎您通过第4条提到的渠道及时反馈给本站。</p>
            <p className="mb-2 text-gray-700">5.5 个人书签/收藏服务：您在本站平台保存的个人书签、收藏、备注等信息默认只对您本人可见，本站不会主动向其他用户或公众展示这些内容。如果您选择分享这些内容，请确保分享的内容符合相关法律法规。</p>
            <p className="mb-2 text-gray-700">5.6 您需要对自己收藏和分享的内容负责，确保其合法性、安全性和合规性。如果包含违法违规、侵权、恶意软件或其他不当内容，您需要承担相应的法律后果。</p>
            <p className="mb-2 text-gray-700">5.7 关于个人书签/收藏的说明：对于您个人收藏的第三方内容，由于技术限制和合理成本考虑，本站无法对所有内容进行实时、全面的逐一审查，也不承担连带责任。但在收到有效反馈或根据法律要求时，本站可能会采取限制分享、清理数据等措施。</p>
            <p className="mb-2 text-gray-700">5.8 内容管理权限：为了维护平台秩序和用户安全，本站有权查看并审查您收藏和分享的链接内容。如果发现个人书签/收藏中存在违法违规或不当内容，或者收到相关投诉，本站有权采取但不限于删除/屏蔽相关内容、限制功能使用、临时或永久限制账号等措施。在紧急情况下，本站可能会先行处理并保留相关证据。</p>
            <p className="mb-2 text-gray-700">5.9 分享责任提醒：如果您通过本站的平台分享第三方站点、内容或链接，请确保其合法合规、真实准确，并已获得必要的授权。请不要分享违法违规、侵权、恶意软件、欺诈或其他不当内容。因分享行为引发的任何纠纷或损失，需要由您自行承担法律责任。本站可能会基于风险控制需要移除相关分享或限制账号。</p>
            <p className="mb-2 text-gray-700">5.10 恶意行为法律责任：严禁利用本站平台漏洞、技术缺陷或其他技术手段进行非法活动，包括但不限于非法获取用户信息、破坏系统安全、进行网络攻击、传播恶意代码等行为。任何此类恶意行为都将承担相应的法律责任，本站保留追究其法律责任的权力，并会积极配合相关执法部门进行调查处理。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">6. 知识产权保护</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">6.1 本站平台的设计、界面、功能、文字描述等内容（不包括第三方网站的内容）都受到相关法律法规的保护。</p>
            <p className="mb-2 text-gray-700">6.2 未经本站书面同意，请不要复制、抓取、镜像、改编或用于商业用途本站的内容。</p>
            <p className="mb-2 text-gray-700">6.3 第三方网站的商标、作品、专利等内容，归相应的第三方或权利人所有。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">7. 服务限制与免责说明</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">7.1 在法律允许的范围内，本站无法对第三方网站的内容质量、稳定性、可用性、准确性、合法性或安全性做出保证，也不对因此产生的任何损失承担责任。</p>
            <p className="mb-2 text-gray-700">7.2 如果因为自然灾害、网络故障、黑客攻击、病毒入侵或其他不可抗力因素导致服务中断或数据损失，本站无法承担相应责任。</p>
            <p className="mb-2 text-gray-700">7.3 技术完善与持续优化：本站致力于为您提供优质的服务体验，但由于技术发展的复杂性和团队资源的限制，本站的系统可能仍存在需要持续改进和完善的地方。在技术迭代过程中，可能会遇到功能优化、性能提升、安全加固等需要不断完善的情况。本站非常重视您的使用体验，如果您在使用过程中发现任何需要改进的地方或遇到技术问题，欢迎您随时通过反馈渠道与本站联系，本站会认真对待每一个反馈，及时分析并努力优化改进。同时，本站也希望您能理解，在技术发展的道路上，本站始终在努力做得更好。</p>
            <p className="mb-2 text-gray-700">7.4 由于本站的服务目前免费提供，本站不对因使用第三方网站内容而产生的任何直接或间接损失承担责任。对于因本站服务在技术完善过程中可能产生的问题，本站希望能够通过持续改进来减少影响，但无法承担相应的赔偿责任。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">8. 服务变更与调整</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">8.1 为了提供更好的服务体验，本站可能会根据运营需要、安全考虑、合规要求或不可抗力等因素，对部分或全部服务进行调整、中断或终止。</p>
            <p className="mb-2 text-gray-700">8.2 如果出现以下情况，本站可能会采取限制账号权限、暂停或终止服务等措施：违反法律法规或本协议、涉嫌侵权或不当行为、危害平台或用户安全等。</p>
            <p className="mb-2 text-gray-700">8.3 因上述措施造成的影响，除法律另有规定外，本站无法承担相应责任。</p>
            <p className="mb-2 text-gray-700">8.4 本站保留对链接收录、展示位置、排序等事项的自主决定权。本站可能会出于运营、合规或其他合理原因，对任何链接进行调整、下架、屏蔽或终止展示，并会尽量提前通知您。</p>
          </div>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-teal-700">9. 通知与沟通</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">9.1 本站会通过网站公告、站内提示、您预留的电子邮箱或其他合理方式向您发送通知，发送之日即视为已送达。</p>
            <p className="mb-2 text-gray-700">9.2 请您保持联系方式的真实性和有效性，并及时更新，以免错过重要通知。</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-teal-700">10. 法律适用与争议解决</h2>
          <div className="ml-4">
            <p className="mb-2 text-gray-700">10.1 本协议的订立、效力、解释、履行及争议的解决，适用中华人民共和国法律。</p>
            <p className="mb-2 text-gray-700">10.2 如果因为本协议或使用本站的服务产生任何争议，本站建议双方首先通过友好协商的方式解决；如果协商不成，任何一方都可以向本站所在地有管辖权的人民法院提起诉讼。</p>
          </div>
        </section>

        <p className="text-gray-600 mb-4">最后更新日期：2025年09月01日</p>
      </div>
      
      <div className="text-center">
        <Link href="/" className="text-teal-600 hover:text-teal-800 mr-4">
          返回首页
        </Link>
        <Link href="/privacy" className="text-teal-600 hover:text-teal-800">
          查看隐私政策
        </Link>
      </div>
    </div>
  );
}

