/**
 * JSON转Java对象工具
 * 
 * 这是一个通用的JSON到Java代码转换工具，可以在任何需要
 * 将JSON数据结构转换为Java POJO类的场景中使用。
 * 
 * 特性：
 * - 支持嵌套对象和数组
 * - 可选Lombok注解支持
 * - 可选驼峰命名转换
 * - 自动生成getter/setter方法
 * - 智能类型推断
 */

export interface JsonToJavaOptions {
    useLombok: boolean;
    useCamelCase: boolean;
    className?: string;
}

export interface JavaClass {
    className: string;
    code: string;
    innerClasses: JavaClass[];
}

/**
 * 将字符串转换为驼峰命名
 */
function toCamelCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * 将字符串转换为帕斯卡命名（首字母大写）
 */
function toPascalCase(str: string): string {
    const camelCase = toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * 获取Java类型
 */
function getJavaType(value: any, key: string, options: JsonToJavaOptions): string {
    if (value === null) {
        return 'Object';
    }

    const type = typeof value;

    switch (type) {
        case 'string':
            return 'String';
        case 'number':
            return Number.isInteger(value) ? 'Integer' : 'Double';
        case 'boolean':
            return 'Boolean';
        case 'object':
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    return 'List<Object>';
                }
                const firstElement = value[0];
                const elementType = getJavaType(firstElement, key, options);
                return `List<${elementType}>`;
            } else {
                // 对象类型，生成内部类名
                const className = options.useCamelCase ? toPascalCase(key) : key.charAt(0).toUpperCase() + key.slice(1);
                return className;
            }
        default:
            return 'Object';
    }
}

/**
 * 生成Java类代码
 */
function generateJavaClass(
    obj: any,
    className: string,
    options: JsonToJavaOptions,
    isInnerClass: boolean = false
): JavaClass {
    const innerClasses: JavaClass[] = [];
    const fields: string[] = [];

    // 处理对象的每个属性
    Object.entries(obj).forEach(([key, value]) => {
        const fieldName = options.useCamelCase ? toCamelCase(key) : key;
        const javaType = getJavaType(value, key, options);

        // 如果是对象类型，生成内部类
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            const innerClassName = options.useCamelCase ? toPascalCase(key) : key.charAt(0).toUpperCase() + key.slice(1);
            const innerClass = generateJavaClass(value, innerClassName, options, true);
            innerClasses.push(innerClass);
        }

        // 如果是数组且包含对象，为数组元素生成内部类
        if (Array.isArray(value) && value.length > 0) {
            const firstElement = value[0];
            if (firstElement !== null && typeof firstElement === 'object' && !Array.isArray(firstElement)) {
                const elementClassName = options.useCamelCase ? toPascalCase(key.replace(/s$/, '')) : key.replace(/s$/, '').charAt(0).toUpperCase() + key.replace(/s$/, '').slice(1);
                const elementClass = generateJavaClass(firstElement, elementClassName, options, true);
                innerClasses.push(elementClass);
            }
        }

        fields.push(`    private ${javaType} ${fieldName};`);
    });

    // 生成类代码
    let classCode = '';

    // 添加导入语句（仅对顶级类）
    if (!isInnerClass) {
        const imports: string[] = [];
        if (options.useLombok) {
            imports.push('import lombok.Data;');
        }

        // 检查是否需要List导入
        const needsList = fields.some(field => field.includes('List<'));
        if (needsList) {
            imports.push('import java.util.List;');
        }

        if (imports.length > 0) {
            classCode += imports.join('\n') + '\n\n';
        }
    }

    // 添加Lombok注解
    if (options.useLombok) {
        classCode += '@Data\n';
    }

    // 类声明
    const classModifier = isInnerClass ? 'public static' : 'public';
    classCode += `${classModifier} class ${className} {\n`;

    // 添加字段
    classCode += fields.join('\n');

    if (fields.length > 0) {
        classCode += '\n';
    }

    // 如果不使用Lombok，生成getter和setter
    if (!options.useLombok) {
        Object.entries(obj).forEach(([key, value]) => {
            const fieldName = options.useCamelCase ? toCamelCase(key) : key;
            const javaType = getJavaType(value, key, options);
            const methodName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

            // Getter
            classCode += `\n    public ${javaType} get${methodName}() {\n`;
            classCode += `        return ${fieldName};\n`;
            classCode += '    }\n';

            // Setter
            classCode += `\n    public void set${methodName}(${javaType} ${fieldName}) {\n`;
            classCode += `        this.${fieldName} = ${fieldName};\n`;
            classCode += '    }\n';
        });
    }

    // 添加内部类
    if (innerClasses.length > 0) {
        classCode += '\n';
        innerClasses.forEach(innerClass => {
            classCode += '\n    ' + innerClass.code.split('\n').join('\n    ') + '\n';
        });
    }

    classCode += '}';

    return {
        className,
        code: classCode,
        innerClasses
    };
}

/**
 * 将JSON对象转换为Java类
 */
export function jsonToJava(jsonObj: any, options: JsonToJavaOptions): string {
    if (!jsonObj || typeof jsonObj !== 'object') {
        throw new Error('输入必须是有效的JSON对象');
    }

    const className = options.className || 'JsonData';
    const javaClass = generateJavaClass(jsonObj, className, options);

    return javaClass.code;
}